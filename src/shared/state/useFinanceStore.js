import { create } from "zustand";

/**
 * Live household data mirrored from Firestore snapshots.
 *
 * This store holds *data only*. Anything configurable (labels, colours, menus,
 * form shape) lives in the CMS store instead, and anything derived (summaries,
 * budget usage) is computed in `utils/finance.js` — keeping this file free of
 * business rules.
 */
export const useFinanceStore = create((set) => ({
  family: null,
  members: [],
  categories: [],
  accounts: [],
  budgets: [],
  savingsGoals: [],
  savingContributions: [],
  financeRecords: [],
  financePayments: [],
  transactions: [],

  /** True until the first snapshot for each collection has arrived. */
  loading: {
    transactions: true,
    categories: true,
    budgets: true,
    savings: true,
    finance: true,
    members: true
  },

  setFamily: (family) => set({ family }),
  setMembers: (members) => set((state) => ({ members, loading: { ...state.loading, members: false } })),
  setCategories: (categories) =>
    set((state) => ({ categories, loading: { ...state.loading, categories: false } })),
  setAccounts: (accounts) => set({ accounts }),
  setBudgets: (budgets) => set((state) => ({ budgets, loading: { ...state.loading, budgets: false } })),
  setSavingsGoals: (savingsGoals) =>
    set((state) => ({ savingsGoals, loading: { ...state.loading, savings: false } })),
  setSavingContributions: (savingContributions) => set({ savingContributions }),
  setFinanceRecords: (financeRecords) =>
    set((state) => ({ financeRecords, loading: { ...state.loading, finance: false } })),
  setFinancePayments: (financePayments) => set({ financePayments }),
  setTransactions: (transactions) =>
    set((state) => ({ transactions, loading: { ...state.loading, transactions: false } })),

  /* ---------------------------------------------------------- optimistic ---
   * Snapshots overwrite these within milliseconds; they exist so the UI reacts
   * instantly (and so offline writes are visible before they sync).
   */
  addTransaction: (transaction) =>
    set((state) => ({ transactions: [transaction, ...state.transactions] })),

  updateTransactionLocal: (id, updates) =>
    set((state) => ({
      transactions: state.transactions.map((item) =>
        item.id === id ? { ...item, ...updates } : item,
      )
    })),

  removeTransactionLocal: (id) =>
    set((state) => ({ transactions: state.transactions.filter((item) => item.id !== id) })),

  restoreTransactions: (transactions) => set({ transactions }),

  resetHouseholdData: () =>
    set({
      family: null,
      members: [],
      categories: [],
      accounts: [],
      budgets: [],
      savingsGoals: [],
      savingContributions: [],
      financeRecords: [],
      financePayments: [],
      transactions: [],
      loading: {
        transactions: true,
        categories: true,
        budgets: true,
        savings: true,
        finance: true,
        members: true
      }
    })
}));
