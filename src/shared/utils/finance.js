import dayjs from "dayjs";
import { getBookMonthRange, inDateRange } from "./dateFilters";

/**
 * Pure finance calculations. No React, no Firestore, no formatting — everything
 * here takes plain data and returns plain data, so it is trivial to reason about
 * and reuse between the dashboard, reports and the Excel export.
 */

export function sumAmount(items) {
  return items.reduce((total, item) => total + Number(item.amount || 0), 0);
}

/** Normalises a Firestore Timestamp, Date or string into `YYYY-MM-DD`. */
export function toDateString(value) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  if (typeof value?.toDate === "function") return dayjs(value.toDate()).format("YYYY-MM-DD");
  if (typeof value?.seconds === "number") return dayjs(value.seconds * 1000).format("YYYY-MM-DD");
  return dayjs(value).format("YYYY-MM-DD");
}

export function filterByRange(transactions, startDate, endDate) {
  return transactions.filter((item) => inDateRange(toDateString(item.date), startDate, endDate));
}

/**
 * Income / expense / net for a date range.
 *
 * @returns {{income:number, expense:number, net:number, count:number, savingRate:number}}
 */
export function buildSummary(transactions) {
  const income = sumAmount(transactions.filter((item) => item.type === "income"));
  const expense = sumAmount(transactions.filter((item) => item.type === "expense"));

  return {
    income,
    expense,
    net: income - expense,
    count: transactions.length,
    savingRate: income > 0 ? ((income - expense) / income) * 100 : 0
  };
}

/** Percentage change between two periods; null when there is no baseline. */
export function percentChange(current, previous) {
  if (!previous) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/** Running balance across *all* transactions, ignoring any period filter. */
export function buildRunningBalance(transactions) {
  return transactions.reduce((total, item) => {
    const amount = Number(item.amount || 0);
    return item.type === "income" ? total + amount : total - amount;
  }, 0);
}

/** Daily income/expense series for a range — the cash-flow chart. */
export function buildDailySeries(transactions, startDate, endDate) {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const days = Math.max(end.diff(start, "day") + 1, 1);

  const buckets = new Map();
  for (let index = 0; index < days; index += 1) {
    const day = start.add(index, "day");
    buckets.set(day.format("YYYY-MM-DD"), {
      label: day.format("DD MMM"),
      date: day.format("YYYY-MM-DD"),
      income: 0,
      expense: 0
    });
  }

  transactions.forEach((item) => {
    const key = toDateString(item.date);
    const bucket = buckets.get(key);
    if (!bucket) return;
    bucket[item.type === "income" ? "income" : "expense"] += Number(item.amount || 0);
  });

  let running = 0;
  return [...buckets.values()].map((bucket) => {
    running += bucket.income - bucket.expense;
    return { ...bucket, net: bucket.income - bucket.expense, cumulative: running };
  });
}

/** Twelve book months of income vs expense for the given year. */
export function buildMonthlySeries(transactions, year, general) {
  return Array.from({ length: 12 }, (_, monthIndex) => {
    const range = getBookMonthRange(year, monthIndex, general);
    const monthly = filterByRange(transactions, range.startDate, range.endDate);
    const income = sumAmount(monthly.filter((item) => item.type === "income"));
    const expense = sumAmount(monthly.filter((item) => item.type === "expense"));

    return {
      label: dayjs(new Date(year, monthIndex, 1)).format("MMM"),
      monthIndex,
      income,
      expense,
      net: income - expense
    };
  });
}

/**
 * Spend per category, richest first.
 *
 * @param {any[]} transactions
 * @param {{id:string,name:string,color?:string}[]} categories Resolved catalogue.
 * @param {'expense'|'income'} type
 */
export function buildCategoryBreakdown(transactions, categories = [], type = "expense") {
  const catalogue = new Map(categories.map((item) => [item.id, item]));
  const grouped = new Map();

  transactions
    .filter((item) => item.type === type)
    .forEach((item) => {
      const category = catalogue.get(item.categoryId);
      const key = category?.id || item.categoryId || "uncategorised";
      const existing = grouped.get(key) || {
        id: key,
        name: category?.name || item.categoryName || "Tanpa kategori",
        color: category?.color,
        value: 0,
        count: 0
      };

      existing.value += Number(item.amount || 0);
      existing.count += 1;
      grouped.set(key, existing);
    });

  return [...grouped.values()].sort((left, right) => right.value - left.value);
}

/** Income/expense per member, for the "who spends what" comparison. */
export function buildMemberBreakdown(transactions, members = []) {
  const names = new Map(members.map((item) => [item.id, item.fullName || item.name || item.email]));
  const grouped = new Map();

  transactions.forEach((item) => {
    const key = item.userId || "unknown";
    const existing = grouped.get(key) || {
      id: key,
      name: names.get(key) || item.memberName || "Tanpa nama",
      income: 0,
      expense: 0,
      count: 0
    };

    existing[item.type === "income" ? "income" : "expense"] += Number(item.amount || 0);
    existing.count += 1;
    grouped.set(key, existing);
  });

  return [...grouped.values()].sort((left, right) => right.expense - left.expense);
}

/**
 * Budget usage for a period.
 *
 * `alertThreshold` comes from the CMS, so "near the limit" means whatever the
 * family decided it means.
 */
export function buildBudgetUsage(budgets, transactions, categories = [], alertThreshold = 90) {
  const catalogue = new Map(categories.map((item) => [item.id, item]));

  return budgets.map((budget) => {
    const limit = Number(budget.monthlyLimit ?? budget.amount ?? 0);
    const spent = sumAmount(
      transactions.filter(
        (item) => item.type === "expense" && item.categoryId === budget.categoryId,
      ),
    );
    const percent = limit > 0 ? (spent / limit) * 100 : 0;
    const category = catalogue.get(budget.categoryId);

    return {
      ...budget,
      limit,
      spent,
      remaining: limit - spent,
      percent,
      categoryName: category?.name || budget.categoryName || budget.categoryId,
      categoryColor: category?.color,
      isOver: spent > limit && limit > 0,
      isNearLimit: percent >= alertThreshold && spent <= limit
    };
  });
}

/** Progress per savings goal, including contribution history totals. */
export function buildGoalProgress(goals, contributions = []) {
  const today = dayjs();

  return goals.map((goal) => {
    const goalContributions = contributions.filter((item) => item.savingGoalId === goal.id);
    const contributed = goalContributions.length
      ? sumAmount(goalContributions)
      : Number(goal.currentAmount || 0);
    const target = Number(goal.targetAmount || 0);
    const dueDate = toDateString(goal.targetDate);
    const daysRemaining = dueDate ? dayjs(dueDate).diff(today, "day") : null;
    const isReached = target > 0 && contributed >= target;

    return {
      ...goal,
      targetDate: dueDate,
      contributed,
      target,
      remaining: Math.max(target - contributed, 0),
      percent: target > 0 ? (contributed / target) * 100 : 0,
      daysRemaining,
      isReached,
      isOverdue: !isReached && daysRemaining !== null && daysRemaining < 0,
      contributionCount: goalContributions.length
    };
  });
}

/**
 * Debt / receivable status.
 *
 * Payments are summed from the payment log rather than trusting a denormalised
 * `totalPaid`, so a deleted payment can never leave a stale balance behind.
 */
export function buildFinanceRecords(records, payments = []) {
  const today = dayjs();

  return records.map((record) => {
    const recordPayments = payments.filter(
      (item) => (item.financeRecordId || item.recordId) === record.id,
    );
    const paid = recordPayments.reduce(
      (total, item) => total + Number(item.amount ?? item.paymentAmount ?? 0),
      0,
    );
    const principal = Number(record.amountInitial ?? record.amount ?? 0);
    const remaining = Math.max(principal - paid, 0);
    const dueDate = toDateString(record.dueDate);
    const daysRemaining = dueDate ? dayjs(dueDate).diff(today, "day") : null;
    const isSettled = remaining <= 0 || record.status === "paid";

    return {
      ...record,
      dueDate,
      startDate: toDateString(record.startDate),
      principal,
      paid,
      remaining,
      percent: principal > 0 ? (paid / principal) * 100 : 0,
      paymentCount: recordPayments.length,
      daysRemaining,
      isSettled,
      isOverdue: !isSettled && daysRemaining !== null && daysRemaining < 0,
      isDueSoon: !isSettled && daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 7,
      status: isSettled ? "paid" : daysRemaining !== null && daysRemaining < 0 ? "overdue" : "active"
    };
  });
}

/** Totals split by debt vs receivable, used by the dashboard tiles. */
export function getFinanceTotals(records) {
  return records.reduce(
    (accumulator, item) => {
      const amount = Number(item.remaining ?? item.amountRemaining ?? 0);
      if (item.recordType === "debt") accumulator.totalDebt += amount;
      if (item.recordType === "receivable") accumulator.totalReceivable += amount;
      return accumulator;
    },
    { totalDebt: 0, totalReceivable: 0 },
  );
}

export function getSavingsTotal(goals) {
  return goals.reduce(
    (total, item) => total + Number(item.contributed ?? item.currentAmount ?? 0),
    0,
  );
}

/**
 * Suggests a category from a free-text note by looking at what the user chose
 * last time they typed something similar. Powers the quick-add form's smart
 * suggestion without any server round-trip.
 */
export function suggestCategory(note, transactions, type) {
  const keyword = String(note || "").trim().toLowerCase();
  if (keyword.length < 3) return null;

  const scored = new Map();

  transactions
    .filter((item) => item.type === type && item.categoryId)
    .forEach((item) => {
      const haystack = `${item.note || ""} ${item.title || ""}`.toLowerCase();
      if (!haystack.includes(keyword) && !keyword.includes(haystack.trim())) return;

      scored.set(item.categoryId, (scored.get(item.categoryId) || 0) + 1);
    });

  const best = [...scored.entries()].sort((left, right) => right[1] - left[1])[0];
  return best ? { categoryId: best[0], confidence: best[1] } : null;
}

/** The amounts this user enters most often — offered as one-tap chips. */
export function frequentAmounts(transactions, type, limit = 4) {
  const counts = new Map();

  transactions
    .filter((item) => item.type === type)
    .forEach((item) => {
      const amount = Number(item.amount || 0);
      if (amount <= 0) return;
      counts.set(amount, (counts.get(amount) || 0) + 1);
    });

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([amount]) => amount)
    .sort((left, right) => left - right);
}
