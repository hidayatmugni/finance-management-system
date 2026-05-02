import { create } from "zustand";
import { getCurrentBookMonthRange } from "../utils/dateFilters";

function createDefaultFilters() {
  const { startDate, endDate } = getCurrentBookMonthRange();

  return {
    activeMemberId: "all",
    startDate,
    endDate,
    type: "all",
    categoryId: "all"
  };
}

export const useFinanceStore = create((set) => ({
  family: null,
  members: [],
  accounts: [],
  categories: [],
  savingsGoals: [],
  savingContributions: [],
  financeRecords: [],
  financePayments: [],
  transactions: [],
  filters: createDefaultFilters(),
  setFamily: (family) => set({ family }),
  setMembers: (members) => set({ members }),
  setAccounts: (accounts) => set({ accounts }),
  setCategories: (categories) => set({ categories }),
  setSavingsGoals: (savingsGoals) => set({ savingsGoals }),
  setSavingContributions: (savingContributions) => set({ savingContributions }),
  setFinanceRecords: (financeRecords) => set({ financeRecords }),
  setFinancePayments: (financePayments) => set({ financePayments }),
  setTransactions: (transactions) => set({ transactions }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetHouseholdData: () =>
    set({
      family: null,
      members: [],
      accounts: [],
      categories: [],
      savingsGoals: [],
      savingContributions: [],
      financeRecords: [],
      financePayments: [],
      transactions: [],
      filters: createDefaultFilters()
    }),
  addTransaction: (transaction) =>
    set((state) => ({
      transactions: [transaction, ...state.transactions]
    }))
}));
