import { financeDb } from "./localDb";

export async function enqueueOfflineMutation(payload) {
  const item = {
    id: crypto.randomUUID(),
    entityType: payload.entityType,
    action: payload.action,
    body: payload.body,
    syncStatus: "pending",
    createdAt: new Date().toISOString()
  };

  await financeDb.offlineQueue.add(item);
  return item;
}

export async function getPendingMutations() {
  return financeDb.offlineQueue.where("syncStatus").equals("pending").toArray();
}

export async function markMutationSynced(id) {
  return financeDb.offlineQueue.update(id, { syncStatus: "synced" });
}
