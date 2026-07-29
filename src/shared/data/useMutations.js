import { useCallback, useMemo } from "react";
import { useAuth } from "../../features/auth/AuthProvider";
import { globalFamilyId } from "../firebase/config";
import {
  createDocument,
  createDocuments,
  deleteDocument,
  deleteDocuments,
  describeFirestoreError,
  reorderDocuments,
  updateDocument
} from "../firebase/firestoreHousehold";
import { useFinanceStore } from "../state/useFinanceStore";
import { useToast } from "../ui/feedback";

/**
 * Write access to household collections.
 *
 * Wraps the Firestore helpers so every call site gets the same behaviour:
 * a resolved family id, the acting user recorded, a success toast, and — most
 * importantly — a readable error instead of a silent failure. Saving a budget
 * used to fail with nothing on screen; now the reason is always shown.
 */
export function useMutations() {
  const { user } = useAuth();
  const toast = useToast();
  const family = useFinanceStore((state) => state.family);
  const familyId = family?.id || globalFamilyId;

  const run = useCallback(
    async (operation, { context, successMessage }) => {
      try {
        const result = await operation();
        if (successMessage) toast.success(successMessage);
        return { ok: true, result };
      } catch (error) {
        const message = describeFirestoreError(error, context);
        toast.error(message);
        // Surfacing the raw error keeps the browser console useful for
        // diagnosing rules problems without re-reading Firestore docs.
        console.error(`[${context}]`, error);
        return { ok: false, error, message };
      }
    },
    [toast],
  );

  return useMemo(
    () => ({
      familyId,

      create: (collectionName, payload, options = {}) =>
        run(() => createDocument(familyId, collectionName, payload, user?.uid), {
          context: options.context || collectionName,
          successMessage: options.successMessage
        }),

      createMany: (collectionName, payloads, options = {}) =>
        run(() => createDocuments(familyId, collectionName, payloads, user?.uid), {
          context: options.context || collectionName,
          successMessage: options.successMessage
        }),

      update: (collectionName, id, payload, options = {}) =>
        run(() => updateDocument(familyId, collectionName, id, payload, user?.uid), {
          context: options.context || collectionName,
          successMessage: options.successMessage
        }),

      remove: (collectionName, id, options = {}) =>
        run(() => deleteDocument(familyId, collectionName, id), {
          context: options.context || collectionName,
          successMessage: options.successMessage
        }),

      removeMany: (collectionName, ids, options = {}) =>
        run(() => deleteDocuments(familyId, collectionName, ids), {
          context: options.context || collectionName,
          successMessage: options.successMessage
        }),

      reorder: (collectionName, orderedIds, options = {}) =>
        run(() => reorderDocuments(familyId, collectionName, orderedIds), {
          context: options.context || collectionName,
          successMessage: options.successMessage
        })
    }),
    [familyId, run, user?.uid],
  );
}
