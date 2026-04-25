import dayjs from "dayjs";
import {
  ArrowUpOutlined,
  BarChartOutlined,
  WalletOutlined
} from "@ant-design/icons";
import { Card, Typography } from "antd";
import { Link } from "react-router-dom";
import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  LineChart,
  BarChart,
  Bar
} from "recharts";
import { useFinanceStore } from "../../shared/state/useFinanceStore";
import { SectionHeading } from "../../shared/components/SectionHeading";
import { MetricCard } from "../../shared/components/MetricCard";
import { TransactionList } from "../../shared/components/TransactionList";
import { EmptyState } from "../../shared/components/EmptyState";
import { formatAxisCurrency, formatCurrency } from "../../shared/utils/format";
import { themePalette } from "../../shared/config/themePalette";
import {
  buildCategoryBreakdown,
  buildCurrentMonthDailyTrend,
  buildFinanceSummary,
  buildUserInputSummary,
  getFinanceTotals,
  getSavingsTotal
} from "../../shared/utils/finance";

export function DashboardPage() {
  const family = useFinanceStore((state) => state.family);
  const transactions = useFinanceStore((state) => state.transactions);
  const savingsGoals = useFinanceStore((state) => state.savingsGoals);
  const financeRecords = useFinanceStore((state) => state.financeRecords);
  const now = dayjs();
  const currentMonthTransactions = transactions.filter((item) => {
    if (!item.date) return false;
    const date = dayjs(item.date);
    return date.year() === now.year() && date.month() === now.month();
  });
  const recentWeeklyTransactions = currentMonthTransactions
    .filter((item) => item.date && dayjs(item.date).isAfter(now.subtract(7, "day").startOf("day")))
    .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());

  const dashboardSummary = {
    ...buildFinanceSummary(transactions),
    ...getFinanceTotals(financeRecords),
    totalSavings: getSavingsTotal(savingsGoals)
  };
  const monthlyTrend = buildCurrentMonthDailyTrend(currentMonthTransactions);
  const categoryBreakdown = buildCategoryBreakdown(currentMonthTransactions);
  const userSummary = buildUserInputSummary(currentMonthTransactions);

  if (!transactions.length && !savingsGoals.length && !financeRecords.length) {
    return (
      <div className="space-y-4">
        <SectionHeading eyebrow="Beranda" title="Ringkasan keuangan keluarga" />
        <EmptyState
          title="Belum ada data"
          description="Mulai dari input harian, lalu catat hutang, piutang, atau target tabungan agar dashboard langsung terisi."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionHeading eyebrow="Beranda" title={`Ringkasan ${family?.name || "keuangan keluarga"}`} />

      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Pemasukan bulan ini" value={dashboardSummary.incomeMonth} tone="income" />
        <MetricCard label="Pengeluaran bulan ini" value={dashboardSummary.expenseMonth} tone="expense" />
        <MetricCard label="Arus kas bersih" value={dashboardSummary.netCashflow} tone="margin" />
        <MetricCard label="Total tabungan" value={dashboardSummary.totalSavings} tone="savings" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Sisa hutang" value={dashboardSummary.totalDebt} tone="warning" />
        <MetricCard label="Sisa piutang" value={dashboardSummary.totalReceivable} tone="default" />
      </div>

      <div className="grid grid-cols-4 gap-2">
        <ShortcutCard title="Input" icon={<ArrowUpOutlined />} to="/dashboard/add" />
        <ShortcutCard title="Tabung" icon={<WalletOutlined />} to="/dashboard/savings" />
        <ShortcutCard title="Hutang" icon={<WalletOutlined />} to="/dashboard/debts" />
        <ShortcutCard title="Lapor" icon={<BarChartOutlined />} to="/dashboard/reports" />
      </div>

       {/* Recent Transactions */}
      <section className="space-y-3">
        <SectionHeading eyebrow="Terbaru" title="Transaksi terakhir" />
        <Typography.Text className="block !text-[11px] !text-muted">
          Menampilkan transaksi 7 hari terakhir pada bulan ini.
        </Typography.Text>
        <TransactionList items={recentWeeklyTransactions} pageSize={8} minHeight={420} />
      </section>

      {/* Monthly Trend */}
      <Card className="finance-card finance-section">
        <SectionHeading eyebrow="Tren" title="Pergerakan bulan ini" />
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={themePalette.colors.lineSoft} strokeDasharray="3 3" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fill: themePalette.colors.muted, fontSize: 11 }}
              />
              <YAxis
                width={44}
                tickLine={false}
                axisLine={false}
                tick={{ fill: themePalette.colors.muted, fontSize: 11 }}
                tickFormatter={formatAxisCurrency}
              />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend
                verticalAlign="top"
                height={24}
                formatter={(value) => (
                  <span style={{ color: themePalette.colors.inkMuted, fontSize: 11, fontWeight: 600 }}>
                    {value === "income" ? "Pemasukan" : "Pengeluaran"}
                  </span>
                )}
              />
              <Line
                type="monotone"
                dataKey="income"
                stroke={themePalette.colors.success}
                strokeWidth={2.5}
                dot={{ r: 2.5, strokeWidth: 0, fill: themePalette.colors.success }}
                activeDot={{ r: 4 }}
                name="income"
              />
              <Line
                type="monotone"
                dataKey="expense"
                stroke={themePalette.colors.expense}
                strokeWidth={2.5}
                dot={{ r: 2.5, strokeWidth: 0, fill: themePalette.colors.expense }}
                activeDot={{ r: 4 }}
                name="expense"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

        {/* Category Breakdown */}
      <section className="space-y-3">
        <SectionHeading eyebrow="Kategori" title="Pengeluaran terbesar" />
        {categoryBreakdown.length ? (
          <Card className="finance-card">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryBreakdown} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={themePalette.colors.lineSoft} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: themePalette.colors.muted, fontSize: 11 }}
                  />
                  <YAxis
                    width={48}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: themePalette.colors.muted, fontSize: 11 }}
                    tickFormatter={formatAxisCurrency}
                  />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="value" name="Pengeluaran" fill={themePalette.colors.expense} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        ) : (
          <EmptyState
            title="Belum ada pengeluaran"
            description="Daftar kategori pengeluaran akan muncul setelah input harian mulai berjalan."
          />
        )}
      </section>

        {/* User Comparison */}
      <section className="space-y-3">
        <SectionHeading eyebrow="User" title="Perbandingan berdasarkan penginput" />
        {userSummary.length ? (
          <div className="space-y-2">
            {userSummary.map((item) => (
              <Card key={item.name} className="finance-card finance-soft-card">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Typography.Text className="!block !text-[12px] !font-semibold !text-ink">
                      {item.name}
                    </Typography.Text>
                    <Typography.Text className="!text-[11px] !text-muted">
                      {item.count} transaksi bulan ini
                    </Typography.Text>
                  </div>
                  <Typography.Text className="!text-[12px] !font-semibold !text-primary">
                    {formatCurrency(item.expense)}
                  </Typography.Text>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Belum ada perbandingan user"
            description="Perbandingan user akan tampil otomatis setelah ada data transaksi."
          />
        )}
      </section>

       
    </div>
  );
}

function ShortcutCard({ title, icon, to }) {
  return (
    <Link to={to} className="block !no-underline">
      <Card className="finance-card finance-soft-card !h-full !border-line !text-center" styles={{ body: { padding: 12 } }}>
        <div className="flex min-h-[65px] flex-col items-center justify-center text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-base font-extrabold text-primary">
            {icon}
          </span>
          <Typography.Text className="mt-2 !text-[11px] !font-semibold !text-ink">{title}</Typography.Text>
        </div>
      </Card>
    </Link>
  );
}
