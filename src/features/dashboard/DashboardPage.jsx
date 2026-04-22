import {
  ArrowUpOutlined,
  BarChartOutlined,
  WalletOutlined
} from "@ant-design/icons";
import { Card, Typography } from "antd";
import { Link } from "react-router-dom";
import {
  Bar,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { useFinanceStore } from "../../shared/state/useFinanceStore";
import { SectionHeading } from "../../shared/components/SectionHeading";
import { MetricCard } from "../../shared/components/MetricCard";
import { TransactionList } from "../../shared/components/TransactionList";
import { SimpleBarList } from "../../shared/components/SimpleBarList";
import { EmptyState } from "../../shared/components/EmptyState";
import { formatAxisCurrency, formatCurrency } from "../../shared/utils/format";
import {
  buildCategoryBreakdown,
  buildFinanceSummary,
  buildMonthlyTrend,
  buildUserInputSummary,
  getFinanceTotals,
  getSavingsTotal
} from "../../shared/utils/finance";

export function DashboardPage() {
  const family = useFinanceStore((state) => state.family);
  const transactions = useFinanceStore((state) => state.transactions);
  const savingsGoals = useFinanceStore((state) => state.savingsGoals);
  const financeRecords = useFinanceStore((state) => state.financeRecords);

  const dashboardSummary = {
    ...buildFinanceSummary(transactions),
    ...getFinanceTotals(financeRecords),
    totalSavings: getSavingsTotal(savingsGoals)
  };
  const monthlyTrend = buildMonthlyTrend(transactions);
  const categoryBreakdown = buildCategoryBreakdown(transactions);
  const userSummary = buildUserInputSummary(transactions);

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
        <MetricCard label="Arus kas bersih" value={dashboardSummary.netCashflow} tone="savings" />
        <MetricCard label="Total tabungan" value={dashboardSummary.totalSavings} tone="savings" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Sisa hutang" value={dashboardSummary.totalDebt} tone="warning" />
        <MetricCard label="Sisa piutang" value={dashboardSummary.totalReceivable} tone="default" />
      </div>

      <div className="grid grid-cols-4 gap-2">
        <ShortcutCard title="Input" icon={<ArrowUpOutlined />} to="/add" />
        <ShortcutCard title="Tabung" icon={<WalletOutlined />} to="/savings" />
        <ShortcutCard title="Hutang" icon={<WalletOutlined />} to="/debts" />
        <ShortcutCard title="Lapor" icon={<BarChartOutlined />} to="/reports" />
      </div>

      <Card className="finance-card finance-section">
        <SectionHeading eyebrow="Tren" title="Perbandingan bulanan" />
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#232325" strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#8e949e", fontSize: 11 }}
              />
              <YAxis
                width={44}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#8e949e", fontSize: 11 }}
                tickFormatter={formatAxisCurrency}
              />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend
                verticalAlign="top"
                height={24}
                formatter={(value) => (
                  <span style={{ color: "#cfd6de", fontSize: 11, fontWeight: 600 }}>
                    {value === "income" ? "Pemasukan" : "Pengeluaran"}
                  </span>
                )}
              />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#19c06c"
                strokeWidth={2.5}
                dot={{ r: 2.5, strokeWidth: 0, fill: "#19c06c" }}
                activeDot={{ r: 4 }}
                name="income"
              />
              <Line
                type="monotone"
                dataKey="expense"
                stroke="#f04452"
                strokeWidth={2.5}
                dot={{ r: 2.5, strokeWidth: 0, fill: "#f04452" }}
                activeDot={{ r: 4 }}
                name="expense"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <section className="space-y-3">
        <SectionHeading eyebrow="Kategori" title="Pengeluaran terbesar" />
        {categoryBreakdown.length ? (
          <SimpleBarList items={categoryBreakdown} colorClass="bg-expense" />
        ) : (
          <EmptyState
            title="Belum ada pengeluaran"
            description="Daftar kategori pengeluaran akan muncul setelah input harian mulai berjalan."
          />
        )}
      </section>

      <section className="space-y-3">
        <SectionHeading eyebrow="User" title="Perbandingan berdasarkan penginput" />
        {userSummary.length ? (
          <SimpleBarList items={userSummary} colorClass="bg-primary" />
        ) : (
          <EmptyState
            title="Belum ada perbandingan user"
            description="Perbandingan user akan tampil otomatis setelah ada data transaksi."
          />
        )}
      </section>

      <section className="space-y-3">
        <SectionHeading eyebrow="Terbaru" title="Transaksi terakhir" />
        <TransactionList items={transactions.slice(0, 12)} />
      </section>
    </div>
  );
}

function ShortcutCard({ title, icon, to }) {
  return (
    <Link to={to} className="block !no-underline">
      <Card className="finance-card finance-soft-card !h-full !border-[#2a2a2c] !text-center" styles={{ body: { padding: 12 } }}>
        <div className="flex min-h-[78px] flex-col items-center justify-center text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#163326] text-base font-extrabold text-[#19c06c]">
            {icon}
          </span>
          <Typography.Text className="mt-2 !text-[11px] !font-semibold !text-ink">{title}</Typography.Text>
        </div>
      </Card>
    </Link>
  );
}
