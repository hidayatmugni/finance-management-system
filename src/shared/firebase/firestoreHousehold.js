import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch
} from "firebase/firestore";
import { db } from "./client.js";
import { globalFamilyId, globalFamilyName } from "./config.js";

/**
 * Firestore access for everything under `families/{familyId}`.
 *
 * All collections share the same generic CRUD helpers so adding an entity is a
 * one-line change, and every error is translated into a message the user can
 * act on rather than a raw Firebase code.
 */

/** Collections the app reads and writes, with their default sort. */
export const COLLECTIONS = {
  members: { path: "members", orderBy: null },
  categories: { path: "categories", orderBy: null },
  accounts: { path: "accounts", orderBy: ["name"] },
  budgets: { path: "budgets", orderBy: null },
  savingGoals: { path: "savingGoals", orderBy: null },
  savingContributions: { path: "savingContributions", orderBy: null },
  financeRecords: { path: "financeRecords", orderBy: null },
  financePayments: { path: "financePayments", orderBy: null },
  transactions: { path: "transactions", orderBy: ["date", "desc"] }
};

/**
 * Turns Firebase errors into actionable Indonesian messages.
 *
 * `permission-denied` is by far the most common failure in this app — it means
 * the Firestore rules have no clause for the collection being written, which is
 * exactly what used to make saving a budget fail silently.
 */
export function describeFirestoreError(error, context = "data") {
  const code = error?.code || "";

  switch (code) {
    case "permission-denied":
      return `Akses ditolak saat menyimpan ${context}. Firestore Rules belum mengizinkan koleksi ini — deploy ulang rules, lalu coba lagi.`;
    case "unavailable":
      return "Tidak dapat menghubungi server. Perubahan akan dicoba lagi saat koneksi kembali.";
    case "not-found":
      return `Data ${context} sudah tidak ada. Muat ulang halaman.`;
    case "failed-precondition":
      return "Query membutuhkan index Firestore yang belum dibuat.";
    case "invalid-argument":
      return `Ada isian ${context} yang tidak valid.`;
    default:
      return error?.message || `Gagal menyimpan ${context}.`;
  }
}

function collectionRef(familyId, name) {
  const config = COLLECTIONS[name];
  if (!config) throw new Error(`Koleksi "${name}" tidak dikenal.`);
  return collection(db, "families", familyId, config.path);
}

function buildQuery(familyId, name) {
  const config = COLLECTIONS[name];
  const reference = collectionRef(familyId, name);
  // Ordering is applied client-side for most collections: a Firestore orderBy
  // hides documents that are missing the field, which silently loses records
  // written by older versions of the app.
  return config.orderBy ? query(reference, orderBy(...config.orderBy)) : query(reference);
}

/** Subscribes to a collection. Returns the unsubscribe function. */
export function watchCollection(familyId, name, onData, onError) {
  return onSnapshot(
    buildQuery(familyId, name),
    (snapshot) => onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    (error) => onError?.(error),
  );
}

export function watchFamily(familyId, onData, onError) {
  return onSnapshot(
    doc(db, "families", familyId),
    (snapshot) => onData(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null),
    onError,
  );
}

/* ------------------------------------------------------------------ writes */

export async function createDocument(familyId, name, payload, userId) {
  return addDoc(collectionRef(familyId, name), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: userId || null
  });
}

export async function updateDocument(familyId, name, id, payload, userId) {
  return updateDoc(doc(db, "families", familyId, COLLECTIONS[name].path, id), {
    ...payload,
    updatedAt: serverTimestamp(),
    updatedBy: userId || null
  });
}

export async function deleteDocument(familyId, name, id) {
  return deleteDoc(doc(db, "families", familyId, COLLECTIONS[name].path, id));
}

/** Deletes many documents in one round trip (bulk actions in list pages). */
export async function deleteDocuments(familyId, name, ids) {
  const batch = writeBatch(db);
  ids.forEach((id) => batch.delete(doc(db, "families", familyId, COLLECTIONS[name].path, id)));
  return batch.commit();
}

/** Writes many documents at once — used by the "import default categories" action. */
export async function createDocuments(familyId, name, payloads, userId) {
  const batch = writeBatch(db);

  payloads.forEach((payload) => {
    const reference = payload.id
      ? doc(db, "families", familyId, COLLECTIONS[name].path, payload.id)
      : doc(collectionRef(familyId, name));

    const { id, ...values } = payload;
    batch.set(reference, {
      ...values,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId || null
    });
  });

  return batch.commit();
}

/** Persists a new display order without touching any other field. */
export async function reorderDocuments(familyId, name, orderedIds) {
  const batch = writeBatch(db);
  orderedIds.forEach((id, index) => {
    batch.update(doc(db, "families", familyId, COLLECTIONS[name].path, id), { order: index });
  });
  return batch.commit();
}

export async function countDocuments(familyId, name) {
  const snapshot = await getDocs(collectionRef(familyId, name));
  return snapshot.size;
}

export async function updateFamily(familyId, payload) {
  return updateDoc(doc(db, "families", familyId), {
    ...payload,
    updatedAt: serverTimestamp()
  });
}

/* ------------------------------------------------------------ provisioning */

/**
 * Ensures the signed-in user has a `users/{uid}` profile and a family member
 * record. The first person to sign in becomes the owner.
 */
export async function ensureUserProvisioned(user) {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const familyId = globalFamilyId;
  const fullName = user.displayName || user.email?.split("@")[0] || "User";
  const existingUser = userSnap.exists() ? userSnap.data() : null;

  const familyRef = doc(db, "families", familyId);
  const familySnap = await getDoc(familyRef);

  if (!familySnap.exists()) {
    await setDoc(familyRef, {
      id: familyId,
      name: globalFamilyName,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  const memberRef = doc(db, "families", familyId, "members", user.uid);
  const memberSnap = await getDoc(memberRef);

  /*
   * Whoever re-creates the family becomes its owner — including after the
   * Firestore data has been wiped. A leftover `users/{uid}` profile saying
   * "member" must not win here, or the person rebuilding the workspace would
   * lock themselves out of the Configuration Center.
   */
  const isBootstrapping = !familySnap.exists();
  const role = isBootstrapping
    ? "owner"
    : memberSnap.data()?.role || existingUser?.role || "member";

  const profile = {
    uid: user.uid,
    fullName,
    email: user.email || "",
    familyId,
    familyName: globalFamilyName,
    role,
    status: "active"
  };

  await setDoc(
    userRef,
    { ...profile, createdAt: existingUser?.createdAt || serverTimestamp(), updatedAt: serverTimestamp() },
    { merge: true },
  );

  await setDoc(
    memberRef,
    {
      id: user.uid,
      familyId,
      fullName,
      email: user.email || "",
      role,
      status: "active",
      createdAt: memberSnap.exists() ? memberSnap.data().createdAt || serverTimestamp() : serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true },
  );

  return profile;
}

export async function updateMemberRole(familyId, memberId, role) {
  await updateDoc(doc(db, "families", familyId, "members", memberId), {
    role,
    updatedAt: serverTimestamp()
  });
  // Keep the top-level profile in step so permission checks agree on both reads.
  await setDoc(doc(db, "users", memberId), { role, updatedAt: serverTimestamp() }, { merge: true });
}
