import { useEffect } from "react";
import { useAuth } from "../../features/auth/AuthProvider";
import { globalFamilyId } from "../firebase/config";
import { watchCollection, watchFamily } from "../firebase/firestoreHousehold";
import { watchAppConfig } from "../firebase/firestoreAppConfig";
import { useAppConfigStore } from "../config/useAppConfig";
import { useFinanceStore } from "../state/useFinanceStore";

/**
 * Opens every realtime subscription the app needs, in one place.
 *
 * Mounted once by the app shell. Snapshot errors are reported through
 * `onError` instead of being swallowed, because a permission-denied here is the
 * difference between "no data yet" and "rules are wrong" — and the user
 * deserves to be told which.
 */
export function useHouseholdSync({ onError } = {}) {
  const { user, token, profile, isFirebaseReady } = useAuth();

  const setFamily = useFinanceStore((state) => state.setFamily);
  const setMembers = useFinanceStore((state) => state.setMembers);
  const setCategories = useFinanceStore((state) => state.setCategories);
  const setAccounts = useFinanceStore((state) => state.setAccounts);
  const setBudgets = useFinanceStore((state) => state.setBudgets);
  const setSavingsGoals = useFinanceStore((state) => state.setSavingsGoals);
  const setSavingContributions = useFinanceStore((state) => state.setSavingContributions);
  const setFinanceRecords = useFinanceStore((state) => state.setFinanceRecords);
  const setFinancePayments = useFinanceStore((state) => state.setFinancePayments);
  const setTransactions = useFinanceStore((state) => state.setTransactions);
  const resetHouseholdData = useFinanceStore((state) => state.resetHouseholdData);

  const setConfigOverrides = useAppConfigStore((state) => state.setOverrides);
  const setConfigStatus = useAppConfigStore((state) => state.setStatus);

  const familyId = profile?.familyId || globalFamilyId;

  useEffect(() => {
    if (!isFirebaseReady || !user || !token) {
      resetHouseholdData();
      return undefined;
    }

    const report = (scope) => (error) => onError?.(scope, error);

    const unsubscribers = [
      watchFamily(familyId, setFamily, report("family")),
      watchCollection(familyId, "members", setMembers, report("members")),
      watchCollection(familyId, "categories", setCategories, report("categories")),
      watchCollection(familyId, "accounts", setAccounts, report("accounts")),
      watchCollection(familyId, "budgets", setBudgets, report("budgets")),
      watchCollection(familyId, "savingGoals", setSavingsGoals, report("savingGoals")),
      watchCollection(familyId, "savingContributions", setSavingContributions, report("savingContributions")),
      watchCollection(familyId, "financeRecords", setFinanceRecords, report("financeRecords")),
      watchCollection(familyId, "financePayments", setFinancePayments, report("financePayments")),
      watchCollection(familyId, "transactions", setTransactions, report("transactions")),
      watchAppConfig(
        familyId,
        (sections) => setConfigOverrides(sections),
        (error) => {
          // Config is optional: without it the app still runs on defaults.
          setConfigStatus("error");
          report("appConfig")(error);
        },
      )
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe?.());
  }, [
    isFirebaseReady,
    user,
    token,
    familyId,
    setFamily,
    setMembers,
    setCategories,
    setAccounts,
    setBudgets,
    setSavingsGoals,
    setSavingContributions,
    setFinanceRecords,
    setFinancePayments,
    setTransactions,
    setConfigOverrides,
    setConfigStatus,
    resetHouseholdData,
    onError
  ]);

  return { familyId };
}
