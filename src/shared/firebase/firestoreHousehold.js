import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from "firebase/firestore";
import { db } from "./client.js";
import { globalFamilyId, globalFamilyName } from "./config.js";

function watchQuery(queryValue, onData, onError) {
  return onSnapshot(
    queryValue,
    (snapshot) => {
      onData(snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() })));
    },
    onError,
  );
}

export async function ensureUserProvisioned(user) {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const familyId = globalFamilyId;
  const familyName = globalFamilyName;
  const fullName = user.displayName || user.email?.split("@")[0] || "User";
  const existingUser = userSnap.exists() ? userSnap.data() : null;
  const familyRef = doc(db, "families", familyId);
  const familySnap = await getDoc(familyRef);

  if (!familySnap.exists()) {
    await setDoc(familyRef, {
      id: familyId,
      name: familyName,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  const memberRef = doc(db, "families", familyId, "members", user.uid);
  const memberSnap = await getDoc(memberRef);
  const fallbackRole = !familySnap.exists() ? "owner" : "member";
  const nextRole = memberSnap.exists()
    ? memberSnap.data().role || existingUser?.role || fallbackRole
    : existingUser?.role || fallbackRole;

  await setDoc(
    userRef,
    {
      uid: user.uid,
      fullName,
      email: user.email || "",
      familyId,
      familyName,
      role: nextRole,
      status: "active",
      createdAt: existingUser?.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true },
  );

  await setDoc(
    memberRef,
    {
      id: user.uid,
      familyId,
      fullName,
      email: user.email || "",
      role: nextRole,
      status: "active",
      createdAt: memberSnap.exists() ? memberSnap.data().createdAt || serverTimestamp() : serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true },
  );

  return {
    uid: user.uid,
    fullName,
    email: user.email || "",
    familyId,
    familyName,
    role: nextRole,
    status: "active"
  };
}

export function watchFamily(familyId, onData, onError) {
  return onSnapshot(doc(db, "families", familyId), (snapshot) => {
    onData(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
  }, onError);
}

export function watchMembers(familyId, onData, onError) {
  return watchQuery(query(collection(db, "families", familyId, "members")), onData, onError);
}

export function watchAccounts(familyId, onData, onError) {
  return watchQuery(query(collection(db, "families", familyId, "accounts"), orderBy("name")), onData, onError);
}

export function watchCategories(familyId, onData, onError) {
  return watchQuery(query(collection(db, "families", familyId, "categories"), orderBy("name")), onData, onError);
}

export function watchSavingGoals(familyId, onData, onError) {
  return watchQuery(query(collection(db, "families", familyId, "savingGoals"), orderBy("targetDate")), onData, onError);
}

export function watchSavingContributions(familyId, onData, onError) {
  return watchQuery(
    query(collection(db, "families", familyId, "savingContributions"), orderBy("date", "desc")),
    onData,
    onError,
  );
}

export function watchFinanceRecords(familyId, onData, onError) {
  return watchQuery(query(collection(db, "families", familyId, "financeRecords"), orderBy("dueDate")), onData, onError);
}

export function watchFinancePayments(familyId, onData, onError) {
  return watchQuery(
    query(collection(db, "families", familyId, "financePayments"), orderBy("paymentDate", "desc")),
    onData,
    onError,
  );
}

export async function updateFamily(familyId, payload) {
  await updateDoc(doc(db, "families", familyId), {
    ...payload,
    updatedAt: serverTimestamp()
  });
}

export async function createAccount(familyId, payload) {
  return addDoc(collection(db, "families", familyId, "accounts"), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function createCategory(familyId, payload) {
  return addDoc(collection(db, "families", familyId, "categories"), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function createSavingGoal(familyId, payload) {
  return addDoc(collection(db, "families", familyId, "savingGoals"), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function createSavingContribution(familyId, payload) {
  return addDoc(collection(db, "families", familyId, "savingContributions"), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function createFinanceRecord(familyId, payload) {
  return addDoc(collection(db, "families", familyId, "financeRecords"), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function createFinancePayment(familyId, payload) {
  return addDoc(collection(db, "families", familyId, "financePayments"), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function updateSavingGoal(familyId, goalId, payload) {
  return updateDoc(doc(db, "families", familyId, "savingGoals", goalId), {
    ...payload,
    updatedAt: serverTimestamp()
  });
}

export async function updateSavingContribution(familyId, contributionId, payload) {
  return updateDoc(doc(db, "families", familyId, "savingContributions", contributionId), {
    ...payload,
    updatedAt: serverTimestamp()
  });
}

export async function updateFinanceRecord(familyId, recordId, payload) {
  return updateDoc(doc(db, "families", familyId, "financeRecords", recordId), {
    ...payload,
    updatedAt: serverTimestamp()
  });
}

export async function updateFinancePayment(familyId, paymentId, payload) {
  return updateDoc(doc(db, "families", familyId, "financePayments", paymentId), {
    ...payload,
    updatedAt: serverTimestamp()
  });
}

export async function deleteSavingGoal(familyId, goalId) {
  return deleteDoc(doc(db, "families", familyId, "savingGoals", goalId));
}

export async function deleteSavingContribution(familyId, contributionId) {
  return deleteDoc(doc(db, "families", familyId, "savingContributions", contributionId));
}

export async function deleteFinanceRecord(familyId, recordId) {
  return deleteDoc(doc(db, "families", familyId, "financeRecords", recordId));
}

export async function deleteFinancePayment(familyId, paymentId) {
  return deleteDoc(doc(db, "families", familyId, "financePayments", paymentId));
}
