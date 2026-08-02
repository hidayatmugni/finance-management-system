import { PlusOutlined, SettingOutlined } from "@ant-design/icons";
import { Button, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useConfigSection, useFormatters } from "../../shared/config/useAppConfig";
import { useCatalogue } from "../../shared/data/useCatalogue";
import { useTheme } from "../../shared/design/ThemeProvider";
import { useLocalStorage } from "../../shared/hooks/useResponsive";
import { useFinanceStore } from "../../shared/state/useFinanceStore";
import { EmptyState, PageHeader, SkeletonStatRow, SortableList, Card } from "../../shared/ui";
import {
  getCurrentBookMonthRange,
  getPreviousBookMonthRange
} from "../../shared/utils/dateFilters";
import {
  buildBudgetUsage,
  buildCategoryBreakdown,
  buildDailySeries,
  buildFinanceRecords,
  buildGoalProgress,
  buildMonthlySeries,
  buildRunningBalance,
  buildSummary,
  filterByRange,
  getSavingsBalance,
  percentChange,
  toDateString
} from "../../shared/utils/finance";
import {
  BalanceWidget,
  BillsWidget,
  BudgetWidget,
  CashflowWidget,
  CategoriesWidget,
  GoalsWidget,
  IncomeExpenseWidget,
  QuickActionsWidget,
  RecentWidget
} from "./widgets";

/**
 * Dashboard.
 *
 * Layout comes from the CMS `dashboard.widgets` list; each user may then
 * reorder their own copy, stored locally. All figures are derived once here and
 * handed to the widgets, so the page does a single pass over the transactions
 * no matter how many widgets are switched on.
 */
export function DashboardPage() {
  const formatters = useFormatters();
  const catalogue = useCatalogue();
  const { colors } = useTheme();

  const general = useConfigSection("general");
  const dashboardConfig = useConfigSection("dashboard");
  const taxonomy = useConfigSection("taxonomy");
  const notifications = useConfigSection("notifications");

  const transactions = useFinanceStore((state) => state.transactions);
  const budgets = useFinanceStore((state) => state.budgets);
  const savingsGoals = useFinanceStore((state) => state.savingsGoals);
  const savingContributions = useFinanceStore((state) => state.savingContributions);
  const financeRecords = useFinanceStore((state) => state.financeRecords);
  const financePayments = useFinanceStore((state) => state.financePayments);
  const loading = useFinanceStore((state) => state.loading.transactions);

  const [customOrder, setCustomOrder] = useLocalStorage("fm:dashboard-order", null);

  const data = useMemo(() => {
    const period = getCurrentBookMonthRange(general);
    const previousPeriod = getPreviousBookMonthRange(general);

    const periodTransactions = filterByRange(transactions, period.startDate, period.endDate);
    const previousTransactions = filterByRange(
      transactions,
      previousPeriod.startDate,
      previousPeriod.endDate,
    );

    const summary = buildSummary(periodTransactions);
    const previousSummary = buildSummary(previousTransactions);

    const records = buildFinanceRecords(financeRecords, financePayments);

    return {
      period,
      year: dayjs().year(),
      colors,
      summary,
      /* The wallet for day-to-day spending: savings deposits have already left
       * it as an expense, and reappear as `savingsBalance` below. */
      balance: buildRunningBalance(transactions),
      savingsBalance: getSavingsBalance(savingContributions),
      deltas: {
        income: percentChange(summary.income, previousSummary.income),
        expense: percentChange(summary.expense, previousSummary.expense)
      },
      dailySeries: buildDailySeries(periodTransactions, period.startDate, period.endDate),
      monthlySeries: buildMonthlySeries(transactions, dayjs().year(), general),
      categoryBreakdown: buildCategoryBreakdown(periodTransactions, catalogue.categories, "expense"),
      budgetUsage: buildBudgetUsage(
        budgets,
        periodTransactions,
        catalogue.categories,
        notifications.budgetAlertThreshold,
      ),
      goals: buildGoalProgress(savingsGoals, savingContributions).filter((goal) => !goal.isReached),
      // Instalments are bills too — for those `dueDate` is the next unpaid
      // month, so the list stays ordered by what is actually owed next.
      upcomingBills: records
        .filter(
          (record) =>
            ["debt", "installment"].includes(record.recordType) &&
            !record.isSettled &&
            record.dueDate,
        )
        .sort((left, right) => String(left.dueDate).localeCompare(String(right.dueDate))),
      recent: [...periodTransactions]
        .sort((left, right) => toDateString(right.date).localeCompare(toDateString(left.date)))
        .slice(0, 6)
        .map((item) => ({ ...item, date: toDateString(item.date) }))
    };
  }, [
    transactions,
    budgets,
    savingsGoals,
    savingContributions,
    financeRecords,
    financePayments,
    catalogue.categories,
    general,
    notifications.budgetAlertThreshold,
    colors
  ]);

  /** CMS order, then the user's personal arrangement layered on top. */
  const widgets = useMemo(() => {
    const enabled = dashboardConfig.widgets.filter((widget) => widget.enabled !== false);
    if (!customOrder) return enabled;

    const byId = new Map(enabled.map((widget) => [widget.id, widget]));
    const ordered = customOrder.map((id) => byId.get(id)).filter(Boolean);
    const added = enabled.filter((widget) => !customOrder.includes(widget.id));

    return [...ordered, ...added];
  }, [dashboardConfig.widgets, customOrder]);

  const quickActions = dashboardConfig.quickActions.filter((item) => item.enabled !== false);
  const hasNoData = !loading && transactions.length === 0 && budgets.length === 0;

  if (loading && transactions.length === 0) {
    return (
      <div className="animate-fade-in">
        <PageHeader eyebrow="Ringkasan" title="Dashboard" />
        <SkeletonStatRow />
      </div>
    );
  }

  if (hasNoData) {
    return (
      <div className="animate-fade-in">
        <PageHeader eyebrow="Ringkasan" title="Dashboard" />
        <Card padding="none">
          <EmptyState
            title="Mulai dari transaksi pertama"
            description={
              catalogue.isEmpty
                ? "Buat beberapa kategori dulu, lalu catat transaksi pertama. Setelah itu dashboard akan terisi otomatis."
                : "Catat pemasukan atau pengeluaran pertama Anda. Ringkasan, grafik, dan anggaran akan langsung tampil di sini."
            }
            action={
              <Link to={catalogue.isEmpty ? "/dashboard/categories" : "/dashboard/add"}>
                <Button type="primary" icon={<PlusOutlined />}>
                  {catalogue.isEmpty ? "Buat kategori" : "Catat transaksi"}
                </Button>
              </Link>
            }
            secondaryAction={
              <Link to="/dashboard/configuration">
                <Button icon={<SettingOutlined />}>Buka konfigurasi</Button>
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  const renderWidget = (widget) => {
    const shared = { widget, data, formatters, catalogue };

    switch (widget.type) {
      case "stat-balance":
        return (
          <BalanceWidget
            data={data}
            formatters={formatters}
            labels={taxonomy.labels}
            loading={loading}
          />
        );
      case "chart-cashflow":
        return <CashflowWidget {...shared} />;
      case "chart-income-expense":
        return <IncomeExpenseWidget {...shared} />;
      case "chart-categories":
        return <CategoriesWidget {...shared} />;
      case "list-budget":
        return <BudgetWidget {...shared} alertThreshold={notifications.budgetAlertThreshold} />;
      case "list-bills":
        return <BillsWidget {...shared} />;
      case "list-goals":
        return <GoalsWidget {...shared} />;
      case "list-recent":
        return <RecentWidget {...shared} />;
      case "quick-actions":
        return <QuickActionsWidget widget={widget} actions={quickActions} />;
      default:
        return null;
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Ringkasan"
        title="Dashboard"
        description={`Periode ${data.period.label}`}
        actions={
          <>
            <Tooltip title="Susun ulang widget">
              <Button
                icon={<SettingOutlined />}
                onClick={() => setCustomOrder(customOrder ? null : widgets.map((item) => item.id))}
              >
                {customOrder ? "Selesai menyusun" : "Susun widget"}
              </Button>
            </Tooltip>
            <Link to="/dashboard/add">
              <Button type="primary" icon={<PlusOutlined />}>
                Catat transaksi
              </Button>
            </Link>
          </>
        }
      />

      {customOrder ? (
        <Card className="mb-4 p-4">
          <Typography.Text className="!mb-3 !block !text-small !text-muted">
            Seret untuk mengubah urutan widget. Susunan ini hanya berlaku untuk Anda — susunan
            default keluarga diatur di halaman konfigurasi.
          </Typography.Text>
          <SortableList
            items={widgets}
            getKey={(item) => item.id}
            onReorder={(items) => setCustomOrder(items.map((item) => item.id))}
            renderItem={(item) => (
              <Typography.Text className="!text-body !text-ink">{item.title}</Typography.Text>
            )}
          />
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {widgets.map((widget) => (
          <div
            key={widget.id}
            className={widget.size === "full" ? "xl:col-span-2" : "xl:col-span-1"}
          >
            {renderWidget(widget)}
          </div>
        ))}
      </div>
    </div>
  );
}
