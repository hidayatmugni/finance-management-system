/**
 * Default application configuration — the seed for the CMS.
 *
 * Every label, colour, menu entry, form field, widget, status and permission the
 * UI renders comes from this shape. The Configuration Center writes overrides
 * into Firestore (`families/{familyId}/appConfig/{section}`) and the store deep
 * merges them over these defaults, so behaviour can change without a deploy.
 *
 * Adding a feature means adding an entry here, never hardcoding it in a page.
 */

export const CONFIG_SECTIONS = [
  "general",
  "theme",
  "navigation",
  "taxonomy",
  "dashboard",
  "forms",
  "workflow",
  "notifications",
  "access"
];

export const appConfigDefaults = {
  /* ------------------------------------------------------------- general */
  general: {
    appName: "Financial Management",
    tagline: "Kelola keuangan keluarga dengan cepat",
    currency: "IDR",
    currencySymbol: "Rp",
    locale: "id-ID",
    decimalPlaces: 0,
    dateFormat: "DD MMM YYYY",
    /** `calendar` = 1st–end of month. `custom` = the 27–26 book period. */
    bookPeriodMode: "custom",
    bookPeriodStartDay: 27,
    bookPeriodEndDay: 26,
    /** Chips shown under money inputs to skip typing common amounts. */
    quickAmounts: [10000, 20000, 50000, 100000],
    density: "comfortable"
  },

  /* --------------------------------------------------------------- theme */
  theme: {
    /** One of the ids in `shared/design/themes.js`. */
    activeTheme: "daylight",
    /** When false, the header theme switcher is hidden and the CMS decides. */
    allowUserOverride: true,
    /** `null` keeps each theme's own accent; a hex here overrides all three. */
    primaryColor: null,
    radiusScale: 1,
    fontScale: 1,
    compact: false
  },

  /* ---------------------------------------------------------- navigation */
  navigation: {
    items: [
      { id: "dashboard", label: "Dashboard", path: "/dashboard", icon: "dashboard", end: true, group: "utama", enabled: true, mobile: true, permission: "dashboard.view" },
      { id: "add", label: "Input Cepat", path: "/dashboard/add", icon: "add", group: "utama", enabled: true, mobile: true, permission: "transaction.create" },
      { id: "transactions", label: "Transaksi", path: "/dashboard/transactions", icon: "transactions", group: "utama", enabled: true, mobile: true, permission: "transaction.view" },
      { id: "budget", label: "Anggaran", path: "/dashboard/budget", icon: "budget", group: "perencanaan", enabled: true, mobile: false, permission: "budget.view" },
      { id: "savings", label: "Tabungan", path: "/dashboard/savings", icon: "savings", group: "perencanaan", enabled: true, mobile: true, permission: "savings.view" },
      { id: "debts", label: "Hutang & Piutang", path: "/dashboard/debts", icon: "debt", group: "perencanaan", enabled: true, mobile: false, permission: "debt.view" },
      { id: "installments", label: "Cicilan", path: "/dashboard/installments", icon: "installment", group: "perencanaan", enabled: true, mobile: false, permission: "debt.view" },
      { id: "reports", label: "Laporan", path: "/dashboard/reports", icon: "reports", group: "analisa", enabled: true, mobile: true, permission: "report.view" },
      { id: "categories", label: "Kategori", path: "/dashboard/categories", icon: "categories", group: "pengaturan", enabled: true, mobile: false, permission: "category.manage" },
      { id: "members", label: "Anggota", path: "/dashboard/members", icon: "users", group: "pengaturan", enabled: true, mobile: false, permission: "member.view" },
      { id: "admin", label: "Data Admin", path: "/dashboard/admin", icon: "database", group: "pengaturan", enabled: true, mobile: false, permission: "data.manage" },
      { id: "cms", label: "Konfigurasi", path: "/dashboard/configuration", icon: "settings", group: "pengaturan", enabled: true, mobile: false, permission: "config.manage" },
      { id: "settings", label: "Preferensi", path: "/dashboard/settings", icon: "sliders", group: "pengaturan", enabled: true, mobile: false, permission: "settings.view" }
    ],
    groups: [
      { id: "utama", label: "Utama" },
      { id: "perencanaan", label: "Perencanaan" },
      { id: "analisa", label: "Analisa" },
      { id: "pengaturan", label: "Pengaturan" }
    ],
    /** Nav ids pinned to the mobile bottom bar; `add` renders as the FAB. */
    bottomBar: ["dashboard", "transactions", "add", "reports", "savings"],
    /**
     * Default entries an admin deleted on purpose.
     *
     * A saved menu replaces the default list wholesale, which used to mean a
     * menu entry shipped in a later release never reached families that had
     * customised their navigation. New defaults are now folded in (see
     * `resolveNavigation`), and this list is what keeps a deliberate delete
     * deleted instead of resurrecting it on the next deploy.
     */
    removedItemIds: []
  },

  /* ------------------------------------------------------------ taxonomy */
  taxonomy: {
    transactionTypes: [
      { id: "expense", label: "Pengeluaran", color: "#EF4444", icon: "arrow-up", direction: -1, enabled: true },
      { id: "income", label: "Pemasukan", color: "#22C55E", icon: "arrow-down", direction: 1, enabled: true }
    ],
    /** Seed categories. Users add more through Categories or inline in the form. */
    categories: [
      { id: "makan", name: "Makan", type: "expense", color: "#F59E0B", icon: "coffee" },
      { id: "minum", name: "Minum", type: "expense", color: "#0EA5E9", icon: "coffee" },
      { id: "belanja", name: "Belanja", type: "expense", color: "#8B5CF6", icon: "shopping" },
      { id: "transport", name: "Transport", type: "expense", color: "#14B8A6", icon: "car" },
      { id: "tagihan", name: "Tagihan", type: "expense", color: "#EC4899", icon: "file" },
      { id: "tabungan", name: "Tabungan", type: "expense", color: "#2563EB", icon: "bank" },
      { id: "kesehatan", name: "Kesehatan", type: "expense", color: "#F97316", icon: "medicine" },
      { id: "lainnya_expense", name: "Lainnya", type: "expense", color: "#64748B", icon: "more" },
      { id: "gaji", name: "Gaji", type: "income", color: "#22C55E", icon: "wallet" },
      { id: "freelance", name: "Freelance", type: "income", color: "#0EA5E9", icon: "laptop" },
      { id: "jual_barang", name: "Jual barang", type: "income", color: "#8B5CF6", icon: "tag" },
      { id: "bonus", name: "Bonus", type: "income", color: "#F59E0B", icon: "gift" },
      { id: "lainnya_income", name: "Lainnya", type: "income", color: "#64748B", icon: "more" }
    ],
    /** Wallets / accounts a transaction can be attached to. */
    accounts: [
      { id: "cash", label: "Tunai", icon: "wallet", color: "#22C55E", enabled: true },
      { id: "bank", label: "Rekening Bank", icon: "bank", color: "#2563EB", enabled: true },
      { id: "ewallet", label: "E-Wallet", icon: "mobile", color: "#8B5CF6", enabled: true }
    ],
    statuses: {
      financeRecord: [
        { id: "active", label: "Berjalan", tone: "warning" },
        { id: "paid", label: "Lunas", tone: "success" },
        { id: "overdue", label: "Terlambat", tone: "danger" }
      ],
      savingGoal: [
        { id: "active", label: "Berjalan", tone: "primary" },
        { id: "paused", label: "Ditunda", tone: "neutral" },
        { id: "completed", label: "Tercapai", tone: "success" }
      ]
    },
    /** UI strings that a family may want to reword. */
    labels: {
      balance: "Saldo berjalan",
      /** Money set aside: it leaves the running balance but is still yours. */
      savingsBalance: "Saldo tabungan",
      income: "Pemasukan",
      expense: "Pengeluaran",
      netCashflow: "Arus kas bersih",
      budget: "Anggaran",
      savings: "Tabungan",
      debt: "Hutang",
      receivable: "Piutang",
      installment: "Cicilan"
    }
  },

  /* ----------------------------------------------------------- dashboard */
  dashboard: {
    widgets: [
      { id: "balance", type: "stat-balance", title: "Ringkasan saldo", size: "full", enabled: true },
      { id: "cashflow", type: "chart-cashflow", title: "Arus kas", size: "half", enabled: true },
      { id: "income-expense", type: "chart-income-expense", title: "Pemasukan vs pengeluaran", size: "half", enabled: true },
      { id: "budget-progress", type: "list-budget", title: "Progress anggaran", size: "half", enabled: true },
      { id: "upcoming-bills", type: "list-bills", title: "Tagihan mendatang", size: "half", enabled: true },
      { id: "goals", type: "list-goals", title: "Target keuangan", size: "half", enabled: true },
      { id: "categories", type: "chart-categories", title: "Pengeluaran per kategori", size: "half", enabled: true },
      { id: "recent", type: "list-recent", title: "Transaksi terbaru", size: "full", enabled: true }
    ],
    quickActions: [
      { id: "add-expense", label: "Catat pengeluaran", path: "/dashboard/add?type=expense", icon: "minus", tone: "danger", enabled: true },
      { id: "add-income", label: "Catat pemasukan", path: "/dashboard/add?type=income", icon: "plus", tone: "success", enabled: true },
      { id: "add-saving", label: "Setor tabungan", path: "/dashboard/savings", icon: "savings", tone: "primary", enabled: true },
      { id: "reports", label: "Lihat laporan", path: "/dashboard/reports", icon: "reports", tone: "info", enabled: true }
    ]
  },

  /* --------------------------------------------------------------- forms */
  forms: {
    transaction: {
      /**
       * `required` and `visible` are honoured by the form renderer. Turning a
       * field off removes it from the flow entirely — that is how the "fewest
       * possible fields" goal is tuned per family.
       */
      fields: [
        { name: "type", label: "Jenis", type: "segmented", required: true, visible: true, defaultValue: "expense", locked: true },
        { name: "amount", label: "Nominal", type: "money", required: true, visible: true, defaultValue: "", locked: true },
        { name: "categoryId", label: "Kategori", type: "category", required: true, visible: true, defaultValue: "" },
        { name: "note", label: "Keterangan", type: "text", required: false, visible: true, defaultValue: "", placeholder: "Opsional — mis. belanja mingguan" },
        { name: "date", label: "Tanggal", type: "date", required: true, visible: true, defaultValue: "today" },
        { name: "accountId", label: "Sumber dana", type: "account", required: false, visible: false, defaultValue: "cash" },
        { name: "userId", label: "Dicatat oleh", type: "member", required: false, visible: false, defaultValue: "current" },
        { name: "tags", label: "Tag", type: "tags", required: false, visible: false, defaultValue: [] }
      ],
      /** Suggest a category from previous notes with the same wording. */
      smartSuggestion: true,
      /** Keep the form open after saving so several entries can be typed fast. */
      keepOpenAfterSave: true,
      autoSaveDraft: true
    },
    budget: {
      fields: [
        { name: "categoryId", label: "Kategori", type: "category", required: true, visible: true, defaultValue: "" },
        { name: "monthlyLimit", label: "Limit bulanan", type: "money", required: true, visible: true, defaultValue: "" },
        { name: "note", label: "Catatan", type: "text", required: false, visible: true, defaultValue: "" }
      ]
    },
    savingGoal: {
      fields: [
        { name: "name", label: "Nama target", type: "text", required: true, visible: true, defaultValue: "" },
        { name: "targetAmount", label: "Jumlah target", type: "money", required: true, visible: true, defaultValue: "" },
        { name: "targetDate", label: "Tanggal target", type: "date", required: true, visible: true, defaultValue: "" },
        { name: "description", label: "Deskripsi", type: "textarea", required: false, visible: true, defaultValue: "" }
      ]
    },
    financeRecord: {
      fields: [
        { name: "personName", label: "Nama pihak", type: "text", required: true, visible: true, defaultValue: "" },
        { name: "amount", label: "Jumlah", type: "money", required: true, visible: true, defaultValue: "" },
        { name: "dueDate", label: "Jatuh tempo", type: "date", required: true, visible: true, defaultValue: "" },
        { name: "description", label: "Keterangan", type: "textarea", required: false, visible: true, defaultValue: "" }
      ]
    }
  },

  /* ------------------------------------------------------------ workflow */
  workflow: {
    approval: {
      enabled: false,
      /** Transactions at or above this amount need a second pair of eyes. */
      thresholdAmount: 5000000,
      approverRole: "owner",
      notifyApprover: true
    },
    automation: {
      /** Mark a debt paid automatically once payments cover the principal. */
      autoCloseSettledDebts: true,
      /** Roll unspent budget into the next period. */
      rolloverUnusedBudget: false,
      /** Create the matching cashflow entry when a saving contribution lands. */
      mirrorSavingsToCashflow: true,
      /**
       * Paying a debt is money leaving the house and collecting a receivable is
       * money arriving, so both belong in the summary. Without this the running
       * balance drifts away from the real wallet.
       */
      mirrorDebtPaymentsToCashflow: true,
      /** Every instalment paid is an expense under the bills category. */
      mirrorInstallmentsToCashflow: true
    },
    reminders: [
      { id: "bill-due", label: "Tagihan jatuh tempo", enabled: true, daysBefore: 3, channel: "inApp" },
      { id: "budget-threshold", label: "Anggaran mendekati limit", enabled: true, threshold: 90, channel: "inApp" },
      { id: "daily-input", label: "Pengingat input harian", enabled: false, time: "20:00", channel: "inApp" }
    ]
  },

  /* ------------------------------------------------------- notifications */
  notifications: {
    channels: { inApp: true, email: false, push: false },
    budgetAlertThreshold: 90,
    templates: [
      {
        id: "budget-exceeded",
        label: "Anggaran terlampaui",
        subject: "Anggaran {{category}} terlampaui",
        body: "Pengeluaran {{category}} sudah {{percent}}% dari limit {{limit}}.",
        enabled: true
      },
      {
        id: "bill-reminder",
        label: "Pengingat tagihan",
        subject: "Tagihan {{person}} jatuh tempo {{dueDate}}",
        body: "Sisa {{amount}} untuk {{person}} jatuh tempo dalam {{days}} hari.",
        enabled: true
      },
      {
        id: "goal-reached",
        label: "Target tabungan tercapai",
        subject: "Target {{goal}} tercapai",
        body: "Selamat! Target {{goal}} sebesar {{amount}} sudah tercapai.",
        enabled: true
      }
    ]
  },

  /* -------------------------------------------------------------- access */
  access: {
    permissions: [
      { id: "dashboard.view", label: "Lihat dashboard" },
      { id: "transaction.view", label: "Lihat transaksi" },
      { id: "transaction.create", label: "Catat transaksi" },
      { id: "transaction.edit", label: "Ubah transaksi" },
      { id: "transaction.delete", label: "Hapus transaksi" },
      { id: "budget.view", label: "Lihat anggaran" },
      { id: "budget.manage", label: "Kelola anggaran" },
      { id: "savings.view", label: "Lihat tabungan" },
      { id: "savings.manage", label: "Kelola tabungan" },
      { id: "debt.view", label: "Lihat hutang & piutang" },
      { id: "debt.manage", label: "Kelola hutang & piutang" },
      { id: "report.view", label: "Lihat laporan" },
      { id: "report.export", label: "Export laporan" },
      { id: "category.manage", label: "Kelola kategori" },
      { id: "member.view", label: "Lihat anggota" },
      { id: "member.manage", label: "Kelola anggota" },
      { id: "data.manage", label: "Kelola data mentah" },
      { id: "settings.view", label: "Lihat preferensi" },
      { id: "config.manage", label: "Kelola konfigurasi aplikasi" }
    ],
    roles: [
      {
        id: "owner",
        label: "Pemilik",
        description: "Akses penuh termasuk konfigurasi aplikasi.",
        /** `*` grants everything, including permissions added later. */
        permissions: ["*"]
      },
      {
        id: "admin",
        label: "Admin",
        description: "Mengelola data dan anggota, tidak mengubah konfigurasi.",
        permissions: [
          "dashboard.view",
          "transaction.view",
          "transaction.create",
          "transaction.edit",
          "transaction.delete",
          "budget.view",
          "budget.manage",
          "savings.view",
          "savings.manage",
          "debt.view",
          "debt.manage",
          "report.view",
          "report.export",
          "category.manage",
          "member.view",
          "member.manage",
          "data.manage",
          "settings.view"
        ]
      },
      {
        id: "member",
        label: "Anggota",
        description: "Mencatat transaksi dan melihat ringkasan.",
        permissions: [
          "dashboard.view",
          "transaction.view",
          "transaction.create",
          "budget.view",
          "savings.view",
          "debt.view",
          "report.view",
          "settings.view"
        ]
      },
      {
        id: "viewer",
        label: "Pengamat",
        description: "Hanya membaca.",
        permissions: ["dashboard.view", "transaction.view", "report.view", "budget.view"]
      }
    ],
    defaultRole: "member"
  }
};

/**
 * Recursively merges a stored override over the defaults.
 *
 * Arrays are replaced wholesale rather than merged element-wise: a saved menu
 * of 8 items must not silently regain a 9th default entry the admin removed.
 */
export function mergeConfig(base, override) {
  if (!override || typeof override !== "object") return base;
  if (Array.isArray(override)) return override;

  const result = { ...base };

  Object.entries(override).forEach(([key, value]) => {
    if (value === undefined) return;

    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      base?.[key] &&
      typeof base[key] === "object" &&
      !Array.isArray(base[key])
    ) {
      result[key] = mergeConfig(base[key], value);
    } else {
      result[key] = value;
    }
  });

  return result;
}

/**
 * Folds menu entries shipped after the family saved their own menu back in.
 *
 * `mergeConfig` replaces arrays wholesale — the right call for a menu an admin
 * curated — but it also means a page added in a later release would be
 * unreachable for anyone who ever touched the Navigation section. Entries the
 * admin deleted on purpose are remembered in `removedItemIds`, so only genuinely
 * new defaults are appended.
 */
export function resolveNavigation(section) {
  const items = Array.isArray(section?.items) ? section.items : [];
  const removed = new Set(section?.removedItemIds || []);
  const present = new Set(items.map((item) => item.id));

  const missing = appConfigDefaults.navigation.items.filter(
    (item) => !present.has(item.id) && !removed.has(item.id),
  );

  return missing.length === 0 ? section : { ...section, items: [...items, ...missing] };
}
