import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { db } from "./client.js";

export function watchTransactions({ familyId, onData, onError }) {
  const transactionsRef = collection(db, "families", familyId, "transactions");
  const transactionsQuery = query(transactionsRef, orderBy("date", "desc"));

  return onSnapshot(
    transactionsQuery,
    (snapshot) => {
      const items = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data()
      }));
      onData(items);
    },
    onError,
  );
}

export async function createTransaction({ familyId, payload }) {
  const transactionsRef = collection(db, "families", familyId, "transactions");

  return addDoc(transactionsRef, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function updateTransaction({ familyId, transactionId, payload }) {
  return updateDoc(doc(db, "families", familyId, "transactions", transactionId), {
    ...payload,
    updatedAt: serverTimestamp()
  });
}

export async function deleteTransaction({ familyId, transactionId }) {
  return deleteDoc(doc(db, "families", familyId, "transactions", transactionId));
}
