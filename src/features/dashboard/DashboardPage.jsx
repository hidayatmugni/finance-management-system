import {
  ArrowUpOutlined,
  BarChartOutlined,
  WalletOutlined
} from "@ant-design/icons";
import { Card, Typography } from "antd";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
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
import { formatCurrency } from "../../shared/utils/format";
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
            <BarChart data={monthlyTrend}>
              <CartesianGrid vertical={false} stroke="#ead9dc" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis hide />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="income" fill="#2f8f57" radius={[8, 8, 0, 0]} />
              <Bar dataKey="expense" fill="#cf4b4b" radius={[8, 8, 0, 0]} />
            </BarChart>
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
    <Link to={to}>
      <Card className="finance-card finance-soft-card !h-full !text-center" styles={{ body: { padding: 12 } }}>
        <div className="flex min-h-[78px] flex-col items-center justify-center text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-base font-extrabold text-primary">
            {icon}
          </span>
          <Typography.Text className="mt-2 !text-[11px] !font-bold">{title}</Typography.Text>
        </div>
      </Card>
    </Link>
  );
}
