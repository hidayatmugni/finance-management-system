import Dexie from "dexie";

export const financeDb = new Dexie("mugni-finance");

financeDb.version(1).stores({
  offlineQueue: "id, entityType, syncStatus, createdAt",
  cachedTransactions: "id, date, type, userId"
});
