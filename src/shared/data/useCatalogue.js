import { useMemo } from "react";
import { useConfigSection } from "../config/useAppConfig";
import { useFinanceStore } from "../state/useFinanceStore";

/**
 * Resolves the option lists every form and filter needs.
 *
 * Categories are *only* what the family created in Firestore — nothing is
 * hardcoded and no invisible defaults are mixed in. The seed list in the CMS
 * config is offered as an explicit one-click import instead (see
 * `seedCategories` on the Categories page), so the catalogue always matches
 * exactly what the admin can see and edit.
 */
export function useCatalogue() {
  const categories = useFinanceStore((state) => state.categories);
  const members = useFinanceStore((state) => state.members);
  const taxonomy = useConfigSection("taxonomy");

  return useMemo(() => {
    const transactionTypes = taxonomy.transactionTypes.filter((item) => item.enabled !== false);
    const accounts = taxonomy.accounts.filter((item) => item.enabled !== false);

    const sortedCategories = [...categories].sort((left, right) => {
      const orderDiff = (left.order ?? 999) - (right.order ?? 999);
      return orderDiff !== 0 ? orderDiff : String(left.name).localeCompare(String(right.name));
    });

    const byId = new Map(sortedCategories.map((item) => [item.id, item]));

    return {
      transactionTypes,
      accounts,
      categories: sortedCategories,
      /** Categories valid for one transaction type. */
      categoriesByType: (type) => sortedCategories.filter((item) => item.type === type),
      categoryOptions: (type) =>
        sortedCategories
          .filter((item) => !type || item.type === type)
          .map((item) => ({
            value: item.id,
            label: item.name,
            color: item.color,
            keywords: item.keywords || ""
          })),
      accountOptions: accounts.map((item) => ({
        value: item.id,
        label: item.label,
        color: item.color
      })),
      typeOptions: transactionTypes.map((item) => ({ value: item.id, label: item.label })),
      memberOptions: members.map((item) => ({
        value: item.id,
        label: item.fullName || item.name || item.email || item.id
      })),
      getCategory: (id) => byId.get(id) || null,
      getCategoryName: (id) => byId.get(id)?.name || "Tanpa kategori",
      getCategoryColor: (id) => byId.get(id)?.color,
      getType: (id) => transactionTypes.find((item) => item.id === id) || null,
      getTypeLabel: (id) => transactionTypes.find((item) => item.id === id)?.label || id,
      getTypeColor: (id) => transactionTypes.find((item) => item.id === id)?.color,
      getAccountLabel: (id) => accounts.find((item) => item.id === id)?.label || "—",
      getMemberName: (id) => {
        const member = members.find((item) => item.id === id);
        return member?.fullName || member?.name || member?.email || "Tanpa nama";
      },
      isEmpty: sortedCategories.length === 0
    };
  }, [categories, members, taxonomy]);
}

/** Status definitions for a given entity, resolved from the CMS. */
export function useStatuses(entity) {
  const taxonomy = useConfigSection("taxonomy");

  return useMemo(() => {
    const statuses = taxonomy.statuses?.[entity] || [];
    return {
      statuses,
      options: statuses.map((item) => ({ value: item.id, label: item.label })),
      get: (id) => statuses.find((item) => item.id === id) || { id, label: id, tone: "neutral" }
    };
  }, [taxonomy, entity]);
}
