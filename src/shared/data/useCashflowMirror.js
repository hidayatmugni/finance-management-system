import { useCallback, useMemo } from "react";
import { useAuth } from "../../features/auth/AuthProvider";
import { useCatalogue } from "./useCatalogue";
import { useMutations } from "./useMutations";

/**
 * Writes the cashflow entry behind a planning action.
 *
 * Paying a debt, settling a receivable, paying an instalment and topping up a
 * savings goal all move real money, but each used to live only inside its own
 * module — so the summary showed a balance the wallet did not have. Every one of
 * them now mirrors into `transactions`, which is the single collection the
 * summary, charts and running balance read.
 *
 * The mirrored transaction carries `sourceModule` and the related record id, so
 * it stays traceable back to what created it.
 */

/**
 * Where each module's money lands, best match first.
 *
 * Categories are whatever the family created in Firestore, so the name is
 * matched rather than an id assumed: a household that never imported the seed
 * list still gets a correctly typed transaction, labelled with `label`, instead
 * of a failed write.
 */
export const MIRROR_PRESETS = {
  debtPayment: {
    type: "expense",
    names: ["Lainnya", "Lain-lain", "Lain2", "Lainnya (Pengeluaran)"],
    label: "Lainnya"
  },
  receivableCollection: {
    type: "income",
    names: ["Lainnya", "Lain-lain", "Lain2", "Lainnya (Pemasukan)"],
    label: "Lainnya"
  },
  installmentPayment: {
    type: "expense",
    names: ["Tagihan", "Cicilan", "Lainnya", "Lain-lain"],
    label: "Tagihan"
  },
  savingContribution: {
    type: "expense",
    names: ["Tabungan", "Lainnya", "Lain-lain"],
    label: "Tabungan"
  }
};

const normalise = (value) => String(value || "").trim().toLowerCase();

export function useCashflowMirror() {
  const catalogue = useCatalogue();
  const mutations = useMutations();
  const { user, profile } = useAuth();

  /** Resolves a preset to a real category, falling back to a plain label. */
  const resolveCategory = useCallback(
    (presetKey) => {
      const preset = MIRROR_PRESETS[presetKey];
      if (!preset) return { categoryId: null, categoryName: null, type: "expense" };

      const pool = catalogue.categoriesByType(preset.type);

      for (const name of preset.names) {
        const match = pool.find((item) => normalise(item.name) === normalise(name));
        if (match) return { categoryId: match.id, categoryName: match.name, type: preset.type };
      }

      // No matching category: the transaction is still recorded, and the
      // breakdown falls back to `categoryName` — better a summary that is right
      // than a write refused because a category is missing.
      return { categoryId: null, categoryName: preset.label, type: preset.type };
    },
    [catalogue],
  );

  /**
   * @param {object} options
   * @param {keyof MIRROR_PRESETS} options.preset
   * @param {number} options.amount
   * @param {string} options.date `YYYY-MM-DD`
   * @param {string} options.note Human description shown in lists.
   * @param {string} options.sourceModule Tag identifying the originating module.
   * @param {object} [options.relations] Extra ids linking back to the source record.
   */
  const mirror = useCallback(
    async ({ preset, amount, date, note, sourceModule, relations = {}, context = "transaksi" }) => {
      const value = Number(amount) || 0;
      if (value <= 0) return { ok: false, skipped: true };

      const category = resolveCategory(preset);

      return mutations.create(
        "transactions",
        {
          type: category.type,
          amount: value,
          categoryId: category.categoryId,
          categoryName: category.categoryName,
          note,
          title: note,
          date,
          accountId: null,
          userId: user?.uid || null,
          memberName: profile?.fullName || user?.displayName || user?.email || null,
          sourceModule,
          ...relations
        },
        { context },
      );
    },
    [mutations, profile, resolveCategory, user],
  );

  return useMemo(() => ({ mirror, resolveCategory }), [mirror, resolveCategory]);
}
