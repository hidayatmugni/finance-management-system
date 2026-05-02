import dayjs from "dayjs";
import {
  getBookMonthFromDate,
  getBookMonthRange,
  inDateRange,
  isInBookMonth,
  isInBookYear
} from "./dateFilters";

function sumAmount(items) {
  return items.reduce((total, item) => total + Number(item.amount || 0), 0);
}

export function buildFinanceSummary(transactions, options = {}) {
  const currentBookMonth = getBookMonthFromDate();
  const targetYear = options.year ?? currentBookMonth.year;
  const targetMonth = options.month ?? currentBookMonth.monthIndex;
  const useWholeYear = targetMonth === null;

  const currentMonthTransactions = transactions.filter((item) => {
    if (!item.date) return false;
    if (useWholeYear) return isInBookYear(item.date, targetYear);
    return isInBookMonth(item.date, targetYear, targetMonth);
  });

  const incomeTransactions = currentMonthTransactions.filter((item) => item.type === "income");
  const expenseTransactions = currentMonthTransactions.filter((item) => item.type === "expense");

  const incomeMonth = sumAmount(incomeTransactions);
  const expenseMonth = sumAmount(expenseTransactions);

  return {
    incomeMonth,
    expenseMonth,
    netCashflow: incomeMonth - expenseMonth,
    totalSavings: 0,
    totalDebt: 0,
    totalReceivable: 0
  };
}

export function buildMonthlyTrend(transactions, options = {}) {
  const currentBookMonth = getBookMonthFromDate();
  const year = options.year ?? currentBookMonth.year;
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

  return months.map((month, monthIndex) => {
    const monthTransactions = transactions.filter((item) => {
      if (!item.date) return false;
      return isInBookMonth(item.date, year, monthIndex);
    });

    return {
      month,
      income: sumAmount(monthTransactions.filter((item) => item.type === "income")),
      expense: sumAmount(monthTransactions.filter((item) => item.type === "expense"))
    };
  });
}

export function buildCurrentMonthDailyTrend(transactions, options = {}) {
  const currentBookMonth = getBookMonthFromDate();
  const range = options.startDate && options.endDate
    ? { startDate: options.startDate, endDate: options.endDate }
    : getBookMonthRange(
        options.year ?? currentBookMonth.year,
        options.month ?? currentBookMonth.monthIndex
      );
  const start = dayjs(range.startDate);
  const end = dayjs(range.endDate);
  const totalDays = end.diff(start, "day") + 1;

  return Array.from({ length: totalDays }, (_, index) => {
    const currentDate = start.add(index, "day");
    const dayTransactions = transactions.filter((item) => {
      if (!item.date) return false;
      return inDateRange(item.date, currentDate.format("YYYY-MM-DD"), currentDate.format("YYYY-MM-DD"));
    });

    return {
      day: currentDate.format("DD MMM"),
      income: sumAmount(dayTransactions.filter((item) => item.type === "income")),
      expense: sumAmount(dayTransactions.filter((item) => item.type === "expense"))
    };
  });
}

export function buildCategoryBreakdown(transactions) {
  const expenseItems = transactions.filter((item) => item.type === "expense");
  const grouped = new Map();

  for (const item of expenseItems) {
    const key = item.categoryName || item.categoryId || "Tanpa kategori";
    grouped.set(key, (grouped.get(key) || 0) + Number(item.amount || 0));
  }

  return [...grouped.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

export function buildMemberComparison(transactions) {
  const grouped = new Map();

  for (const item of transactions) {
    const key = item.memberName || item.userId || "Tanpa nama";
    const current = grouped.get(key) || { name: key, income: 0, expense: 0 };

    if (item.type === "income") {
      current.income += Number(item.amount || 0);
    }

    if (item.type === "expense") {
      current.expense += Number(item.amount || 0);
    }

    grouped.set(key, current);
  }

  return [...grouped.values()].sort((a, b) => b.expense - a.expense);
}

export function buildUserInputSummary(transactions) {
  return buildMemberComparison(transactions).map((item) => ({
    ...item,
    count: transactions.filter((transaction) => (transaction.memberName || transaction.userId) === item.name).length
  }));
}

export function getBiggestSpender(memberComparison) {
  return memberComparison[0]?.name || "-";
}

export function getSavingsTotal(savingsGoals) {
  return savingsGoals.reduce((total, item) => total + Number(item.currentAmount || 0), 0);
}

export function getFinanceTotals(financeRecords) {
  return financeRecords.reduce(
    (accumulator, item) => {
      const amount = Number(item.amountRemaining || 0);
      if (item.recordType === "debt") {
        accumulator.totalDebt += amount;
      }
      if (item.recordType === "receivable") {
        accumulator.totalReceivable += amount;
      }
      return accumulator;
    },
    { totalDebt: 0, totalReceivable: 0 },
  );
}
