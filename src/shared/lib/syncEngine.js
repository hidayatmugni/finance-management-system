import { getPendingMutations, markMutationSynced } from "./offlineQueue";

export async function processPendingSync({ uploadMutation }) {
  const pendingItems = await getPendingMutations();

  for (const item of pendingItems) {
    await uploadMutation(item);
    await markMutationSynced(item.id);
  }

  return pendingItems.length;
}
