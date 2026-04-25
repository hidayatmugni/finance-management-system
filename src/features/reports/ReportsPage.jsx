import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { Button, Card, DatePicker, Modal, Select, Space, Tag, Typography } from "antd";
import { Link } from "react-router-dom";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
  Line,
  LineChart
} from "recharts";
import { useFinanceStore } from "../../shared/state/useFinanceStore";
import { EmptyState } from "../../shared/components/EmptyState";
import { SectionHeading } from "../../shared/components/SectionHeading";
import { MetricCard } from "../../shared/components/MetricCard";
import {
  buildCategoryBreakdown,
  buildFinanceSummary,
  buildUserInputSummary
} from "../../shared/utils/finance";
import { exportLaporanTahunanExcel } from "../../shared/utils/excelExport";
import {
  formatCompactCurrency,
  formatCurrency
} from "../../shared/utils/format";
import { themePalette } from "../../shared/config/themePalette";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export function ReportsPage() {
  const family = useFinanceStore((state) => state.family);
  const members = useFinanceStore((state) => state.members);
  const transactions = useFinanceStore((state) => state.transactions);
  const savingContributions = useFinanceStore((state) => state.savingContributions);
  const financePayments = useFinanceStore((state) => state.financePayments);
  const financeRecords = useFinanceStore((state) => state.financeRecords);
  const [selectedYear, setSelectedYear] = useState(String(dayjs().year()));
  const [activeMemberId, setActiveMemberId] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(null);

  const financeRecordMap = useMemo(
    () => Object.fromEntries(financeRecords.map((item) => [item.id, item])),
    [financeRecords],
  );

  const yearTransactions = useMemo(
    () => filterByYearAndUser(transactions, "date", Number(selectedYear), activeMemberId),
    [activeMemberId, selectedYear, transactions],
  );

  const yearSavingContributions = useMemo(
    () => filterByYearAndUser(savingContributions, "date", Number(selectedYear), activeMemberId),
    [activeMemberId, savingContributions, selectedYear],
  );

  const yearFinancePayments = useMemo(
    () => filterByYearAndUser(financePayments, "paymentDate", Number(selectedYear), activeMemberId),
    [activeMemberId, financePayments, selectedYear],
  );

  const summary = buildFinanceSummary(yearTransactions, {
    year: Number(selectedYear),
    month: null
  });

  const categories = buildCategoryBreakdown(yearTransactions);
  const users = buildUserInputSummary(yearTransactions);

  const monthlyDataset = useMemo(
    () =>
      buildMonthlyReportDataset({
        year: Number(selectedYear),
        transactions: yearTransactions,
        savingContributions: yearSavingContributions,
        financePayments: yearFinancePayments,
        financeRecordMap
      }),
    [financeRecordMap, selectedYear, yearFinancePayments, yearSavingContributions, yearTransactions],
  );

  const yearTotals = useMemo(
    () => ({
      totalSavings: yearSavingContributions.reduce((total, item) => total + Number(item.amount || 0), 0),
      totalDebtPaid: yearFinancePayments
        .filter((item) => financeRecordMap[item.financeRecordId]?.recordType === "debt")
        .reduce((total, item) => total + Number(item.amount || 0), 0),
      totalReceivableCollected: yearFinancePayments
        .filter((item) => financeRecordMap[item.financeRecordId]?.recordType === "receivable")
        .reduce((total, item) => total + Number(item.amount || 0), 0)
    }),
    [financeRecordMap, yearFinancePayments, yearSavingContributions],
  );
  const categoryComposition = useMemo(
    () => buildCategoryComposition(categories),
    [categories],
  );

  const selectedMonthDetail = useMemo(
    () => monthlyDataset.find((item) => item.monthIndex === selectedMonth) || null,
    [monthlyDataset, selectedMonth],
  );

  if (!transactions.length) {
    return (
      <div className="space-y-4">
        <SectionHeading eyebrow="Laporan" title="Ringkasan dan detail bulanan" />
        <EmptyState
          title="Belum ada laporan"
          description="Laporan akan muncul setelah transaksi mulai tercatat."
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SectionHeading eyebrow="Laporan" title="Ringkasan dan detail bulanan" />

      <Card className="finance-card finance-soft-card">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <div>
            <Typography.Text className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              Tahun laporan
            </Typography.Text>
            <DatePicker
              picker="year"
              value={selectedYear ? dayjs(`${selectedYear}-01-01`) : null}
              onChange={(value) => setSelectedYear(value ? String(value.year()) : String(dayjs().year()))}
              size="large"
              className="mt-2 !w-full"
              format="YYYY"
            />
          </div>

          <div>
            <Typography.Text className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              Filter user
            </Typography.Text>
            <Select
              size="large"
              className="mt-2 !w-full"
              value={activeMemberId}
              onChange={setActiveMemberId}
              options={[
                { value: "all", label: "Semua user" },
                ...members.map((member) => ({
                  value: member.id,
                  label: member.fullName || member.name || member.email
                }))
              ]}
            />
          </div>

          <div className="flex items-end gap-2">
            <Button
              type="primary"
              size="large"
              className="w-full"
              onClick={() =>
                exportLaporanTahunanExcel({
                  year: selectedYear,
                  transactions: yearTransactions,
                  familyName: family?.name
                })
              }
            >
              Export Excel
            </Button>
          </div>
        </div>

        <Typography.Paragraph className="!mb-0 !mt-3 !text-[12px] !leading-5 !text-muted">
           Anda bisa filter per user untuk melihat tren pemasukan, pengeluaran, tabungan, dan pembayaran hutang dengan lebih fokus.
        </Typography.Paragraph>

        <Link to="/dashboard/admin" className="mt-3 inline-block !no-underline">
          <Button size="middle">
            Buka admin data
          </Button>
        </Link>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <MetricCard label="Pemasukan" value={summary.incomeMonth} tone="income" />
        <MetricCard label="Pengeluaran" value={summary.expenseMonth} tone="expense" />
        <MetricCard label="Arus kas bersih" value={summary.netCashflow} tone="margin" />
        <MetricCard label="Total nabung" value={yearTotals.totalSavings} tone="savings" />
        <MetricCard label="Bayar hutang" value={yearTotals.totalDebtPaid} tone="warning" />
        <MetricCard label="Piutang masuk" value={yearTotals.totalReceivableCollected} tone="default" />
      </div>
      
      {/* Monthly Trend */}
      <Card className="finance-card">
        <SectionHeading eyebrow="Pergerakan" title={`Comparison per bulan ${selectedYear}`} />
        <Typography.Paragraph className="!mb-0 !mt-1 !text-[12px] !leading-5 !text-muted">
          Grafik ini menampilkan pergerakan pemasukan, pengeluaran, dan arus kas bersih dari Januari sampai Desember pada tahun yang dipilih.
        </Typography.Paragraph>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyDataset} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={themePalette.colors.lineSoft} strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fill: themePalette.colors.muted, fontSize: 11 }}
              />
              <YAxis
                width={44}
                tickLine={false}
                axisLine={false}
                tick={{ fill: themePalette.colors.muted, fontSize: 11 }}
                tickFormatter={(value) => formatCompactCurrency(value)}
              />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend
                verticalAlign="top"
                height={24}
                formatter={(value) => (
                  <span style={{ color: themePalette.colors.inkMuted, fontSize: 11, fontWeight: 600 }}>
                    {value === "income" ? "Pemasukan" : value === "expense" ? "Pengeluaran" : "Arus kas bersih"}
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
              <Line
                type="monotone"
                dataKey="net"
                stroke={themePalette.colors.margin}
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={{ r: 2, strokeWidth: 0, fill: themePalette.colors.margin }}
                activeDot={{ r: 4 }}
                name="net"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* <section className="space-y-2.5">
        <SectionHeading eyebrow="Kategori" title={`Kategori terbesar tahun ${selectedYear}`} />
        {categoryComposition.length ? (
          <Card className="finance-card">
            <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      iconType="circle"
                      formatter={(value) => (
                        <span style={{ color: themePalette.colors.inkMuted, fontSize: 11, fontWeight: 600 }}>
                          {value}
                        </span>
                      )}
                    />
                    <Pie
                      data={categoryComposition}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={82}
                      paddingAngle={3}
                      stroke={themePalette.colors.panel}
                      strokeWidth={4}
                    >
                      {categoryComposition.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                {categoryComposition.map((item) => (
                  <div key={item.name} className="flex items-center justify-between rounded-[12px] border border-line bg-panel px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <div className="min-w-0">
                        <Typography.Text className="!block !truncate !text-[12px] !font-semibold !text-ink">
                          {item.name}
                        </Typography.Text>
                        <Typography.Text className="!text-[11px] !text-muted">
                          {item.percent}% dari total
                        </Typography.Text>
                      </div>
                    </div>
                    <Typography.Text className="!text-[12px] !font-semibold !text-expense">
                      {formatCurrency(item.value)}
                    </Typography.Text>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ) : (
          <EmptyState
            title="Belum ada pengeluaran"
            description="Kategori pengeluaran terbesar akan tampil setelah transaksi expense mulai tercatat."
          />
        )}
      </section> */}

      {/* User Comparison */}
      <section className="space-y-2.5">
        <SectionHeading eyebrow="User" title={`Perbandingan penginput tahun ${selectedYear}`} />
        {users.length ? (
          <div className="space-y-2">
            {users.map((item) => (
              <Card key={item.name} className="finance-card finance-soft-card">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Typography.Text className="!block !text-[12px] !font-semibold !text-ink">
                      {item.name}
                    </Typography.Text>
                    <Typography.Text className="!text-[11px] !text-muted">
                      {item.count} transaksi tercatat
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
            title="Belum ada data user"
            description="Perbandingan penginput akan muncul setelah transaksi pada tahun ini tersedia."
          />
        )}
      </section>

        {/* Monthly Comparison */}
      <Card className="finance-card">
        <SectionHeading eyebrow="Bulanan" title="Comparison bulanan yang lebih ringkas" />
        <Typography.Paragraph className="!mb-0 !mt-1 !text-[12px] !leading-5 !text-muted">
          Klik satu bulan untuk membuka detail lengkap seperti cashflow, nabung, hutang dibayar, dan ringkasan aktivitas di bulan tersebut.
        </Typography.Paragraph>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {monthlyDataset.map((item) => {
            const netPositive = item.net >= 0;
            const dominantValue = Math.max(item.income, item.expense, item.savings, item.debtPaid, 1);
            const incomeWidth = Math.max((item.income / dominantValue) * 100, item.income > 0 ? 10 : 0);
            const expenseWidth = Math.max((item.expense / dominantValue) * 100, item.expense > 0 ? 10 : 0);

            return (
              <button
                key={item.month}
                type="button"
                onClick={() => setSelectedMonth(item.monthIndex)}
                className="rounded-[16px] border border-line bg-panel px-3 py-3 text-left transition hover:border-line-hover hover:bg-white/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Typography.Text strong className="!block !text-[13px] !font-semibold !text-ink">
                      {item.month}
                    </Typography.Text>
                    <Typography.Text className={`!mt-1 !block !text-[11px] !font-semibold ${netPositive ? "!text-income" : "!text-expense"}`}>
                      {netPositive ? "Surplus" : "Defisit"} {formatCompactCurrency(Math.abs(item.net))}
                    </Typography.Text>
                  </div>
                  <Typography.Text className="!text-[10px] !uppercase !tracking-[0.12em] !text-muted">
                    Detail
                  </Typography.Text>
                </div>

                <div className="mt-3 space-y-2">
                  <div>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <Typography.Text className="!text-[10px] !font-medium !uppercase !tracking-[0.12em] !text-muted">
                        Pemasukan
                      </Typography.Text>
                      <Typography.Text className="!text-[11px] !font-semibold !text-income">
                        {formatCompactCurrency(item.income)}
                      </Typography.Text>
                    </div>
                    <div className="h-1.5 rounded-full bg-panel-header">
                      <div
                        className="h-1.5 rounded-full bg-income"
                        style={{ width: `${Math.min(incomeWidth, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <Typography.Text className="!text-[10px] !font-medium !uppercase !tracking-[0.12em] !text-muted">
                        Pengeluaran
                      </Typography.Text>
                      <Typography.Text className="!text-[11px] !font-semibold !text-expense">
                        {formatCompactCurrency(item.expense)}
                      </Typography.Text>
                    </div>
                    <div className="h-1.5 rounded-full bg-panel-header">
                      <div
                        className="h-1.5 rounded-full bg-expense"
                        style={{ width: `${Math.min(expenseWidth, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2">
                  <Typography.Text className="!text-[10px] !text-muted">
                    Nabung {formatCompactCurrency(item.savings)}
                  </Typography.Text>
                  <Typography.Text className="!text-[10px] !text-muted">
                    Bayar hutang {formatCompactCurrency(item.debtPaid)}
                  </Typography.Text>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <MonthlyDetailModal
        detail={selectedMonthDetail}
        activeMemberId={activeMemberId}
        onClose={() => setSelectedMonth(null)}
      />
    </div>
  );
}

function MonthlyDetailModal({ detail, activeMemberId, onClose }) {
  const open = Boolean(detail);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={null}
      centered
      width={420}
      styles={{ content: { background: themePalette.colors.panel, padding: 16 }, body: { padding: 0 } }}
    >
      {detail ? (
        <Space orientation="vertical" size={12} className="w-full">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Typography.Title level={4} className="!mb-0 !text-[15px]">
                Detail {detail.month} {detail.year}
              </Typography.Title>
              <Typography.Text className="mt-1 block !text-[12px] !text-muted">
                {activeMemberId === "all" ? "Global keluarga" : "Filter user aktif"}
              </Typography.Text>
            </div>
            <Tag className={`rounded-full border-0 px-3 py-1 text-xs font-semibold ${detail.net >= 0 ? "bg-income/15 text-income" : "bg-expense/15 text-expense"}`}>
              {detail.net >= 0 ? "Cashflow positif" : "Cashflow negatif"}
            </Tag>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <DetailInfo label="Pemasukan" value={detail.income} tone="income" />
            <DetailInfo label="Pengeluaran" value={detail.expense} tone="expense" />
            <DetailInfo label="Arus kas bersih" value={detail.net} tone={detail.net >= 0 ? "margin" : "expense"} />
            <DetailInfo label="Total nabung" value={detail.savings} tone="savings" />
            <DetailInfo label="Bayar hutang" value={detail.debtPaid} tone="warning" />
            <DetailInfo label="Piutang masuk" value={detail.receivableCollected} tone="default" />
          </div>

          <div className="rounded-[14px] border border-line bg-panel px-3 py-3">
            <Typography.Text className="metric-label">Ringkasan aktivitas</Typography.Text>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[12px] text-muted">
              <div>Jumlah transaksi: <span className="font-semibold text-ink">{detail.transactionCount}</span></div>
              <div>Setoran tabungan: <span className="font-semibold text-ink">{detail.savingsCount}</span></div>
              <div>Pembayaran hutang: <span className="font-semibold text-ink">{detail.debtPaymentCount}</span></div>
              <div>Pelunasan piutang: <span className="font-semibold text-ink">{detail.receivablePaymentCount}</span></div>
            </div>
          </div>
        </Space>
      ) : null}
    </Modal>
  );
}

function DetailInfo({ label, value, tone = "default" }) {
  return <MetricCard label={label} value={value} tone={tone} />;
}

function filterByYearAndUser(items, dateField, year, userId) {
  return items.filter((item) => {
    const dateValue = item[dateField];
    if (!dateValue) return false;
    const date = dayjs(dateValue);
    const matchYear = date.year() === year;
    const matchUser = userId === "all" ? true : item.userId === userId;
    return matchYear && matchUser;
  });
}

function buildMonthlyReportDataset({ year, transactions, savingContributions, financePayments, financeRecordMap }) {
  return MONTH_LABELS.map((month, monthIndex) => {
    const monthTransactions = transactions.filter((item) => dayjs(item.date).year() === year && dayjs(item.date).month() === monthIndex);
    const monthSavings = savingContributions.filter((item) => dayjs(item.date).year() === year && dayjs(item.date).month() === monthIndex);
    const monthPayments = financePayments.filter((item) => dayjs(item.paymentDate).year() === year && dayjs(item.paymentDate).month() === monthIndex);

    const income = sumAmount(monthTransactions.filter((item) => item.type === "income"));
    const expense = sumAmount(monthTransactions.filter((item) => item.type === "expense"));
    const savings = sumAmount(monthSavings);
    const debtPayments = monthPayments.filter((item) => financeRecordMap[item.financeRecordId]?.recordType === "debt");
    const receivablePayments = monthPayments.filter((item) => financeRecordMap[item.financeRecordId]?.recordType === "receivable");
    const debtPaid = sumAmount(debtPayments);
    const receivableCollected = sumAmount(receivablePayments);

    return {
      month,
      monthIndex,
      year,
      income,
      expense,
      net: income - expense,
      savings,
      debtPaid,
      receivableCollected,
      transactionCount: monthTransactions.length,
      savingsCount: monthSavings.length,
      debtPaymentCount: debtPayments.length,
      receivablePaymentCount: receivablePayments.length
    };
  });
}

function sumAmount(items) {
  return items.reduce((total, item) => total + Number(item.amount || 0), 0);
}

function buildCategoryComposition(categories) {
  const palette = [
    themePalette.colors.expense,
    themePalette.colors.warning,
    themePalette.colors.primary,
    themePalette.colors.info,
    themePalette.colors.margin,
    themePalette.colors.success
  ];

  const items = categories
    .filter((item) => Number(item.value || 0) > 0)
    .map((item, index) => ({
      ...item,
      color: palette[index % palette.length]
    }));

  const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1;

  return items.map((item) => ({
    ...item,
    percent: Math.round((Number(item.value || 0) / total) * 100)
  }));
}
