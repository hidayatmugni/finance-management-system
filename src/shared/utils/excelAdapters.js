import dayjs from "dayjs";
import { getBookMonthRange, isInBookYear } from "./dateFilters";
import { buildCategoryBreakdown, buildMemberBreakdown, buildSummary, filterByRange } from "./finance";

/**
 * Shims that keep the Excel writer on the shape it was built against.
 *
 * The workbook layout is long-lived, hand-tuned code; rather than rewrite it
 * against the new finance API, these adapters translate between the two. All
 * calculation still happens in `finance.js` — nothing is duplicated.
 */

/** @returns {{incomeMonth:number, expenseMonth:number, netCashflow:number}} */
export function buildFinanceSummaryLegacy(transactions, options = {}) {
  const { year, month } = options;

  const scoped =
    month === null || month === undefined
      ? transactions.filter((item) => (year ? isInBookYear(item.date, year) : true))
      : (() => {
          const range = getBookMonthRange(year, month);
          return filterByRange(transactions, range.startDate, range.endDate);
        })();

  const summary = buildSummary(scoped);

  return {
    incomeMonth: summary.income,
    expenseMonth: summary.expense,
    netCashflow: summary.net,
    count: summary.count
  };
}

/** @returns {{month:string, income:number, expense:number}[]} */
export function buildMonthlyTrendLegacy(transactions, options = {}) {
  const year = options.year ?? dayjs().year();

  return Array.from({ length: 12 }, (_, monthIndex) => {
    const range = getBookMonthRange(year, monthIndex);
    const summary = buildSummary(filterByRange(transactions, range.startDate, range.endDate));

    return {
      month: dayjs(new Date(year, monthIndex, 1)).format("MMM"),
      income: summary.income,
      expense: summary.expense
    };
  });
}

/** @returns {{name:string, value:number}[]} — top expense categories. */
export function buildCategoryBreakdownLegacy(transactions) {
  return buildCategoryBreakdown(transactions, [], "expense")
    .slice(0, 6)
    .map((item) => ({ name: item.name, value: item.value }));
}

/** @returns {{name:string, income:number, expense:number, count:number}[]} */
export function buildUserInputSummaryLegacy(transactions) {
  return buildMemberBreakdown(transactions, []);
}

/**
 * Legacy category-name lookup. New transactions carry `categoryName` inline, so
 * this only ever runs for rows written before that field existed.
 */
export function getKategoriNameLegacy(categoryId) {
  return categoryId || "Tanpa kategori";
}
