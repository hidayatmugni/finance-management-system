import dayjs from "dayjs";

function sumAmount(items) {
  return items.reduce((total, item) => total + Number(item.amount || 0), 0);
}

export function buildFinanceSummary(transactions, options = {}) {
  const now = dayjs();
  const targetYear = options.year ?? now.year();
  const targetMonth = options.month ?? now.month();
  const useWholeYear = targetMonth === null;

  const currentMonthTransactions = transactions.filter((item) => {
    if (!item.date) return false;
    const date = dayjs(item.date);
    if (useWholeYear) return date.year() === targetYear;
    return date.year() === targetYear && date.month() === targetMonth;
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
  const year = options.year ?? dayjs().year();
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

  return months.map((month, monthIndex) => {
    const monthTransactions = transactions.filter((item) => {
      if (!item.date) return false;
      const date = dayjs(item.date);
      return date.year() === year && date.month() === monthIndex;
    });

    return {
      month,
      income: sumAmount(monthTransactions.filter((item) => item.type === "income")),
      expense: sumAmount(monthTransactions.filter((item) => item.type === "expense"))
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
