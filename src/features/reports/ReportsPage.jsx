import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { Button, Card, DatePicker, Space, Typography } from "antd";
import { useFinanceStore } from "../../shared/state/useFinanceStore";
import { EmptyState } from "../../shared/components/EmptyState";
import { SectionHeading } from "../../shared/components/SectionHeading";
import { MetricCard } from "../../shared/components/MetricCard";
import { SimpleBarList } from "../../shared/components/SimpleBarList";
import {
  buildCategoryBreakdown,
  buildFinanceSummary,
  buildMonthlyTrend,
  buildUserInputSummary
} from "../../shared/utils/finance";
import { exportLaporanTahunanExcel } from "../../shared/utils/excelExport";
import { formatCompactCurrency, formatCurrency } from "../../shared/utils/format";

export function ReportsPage() {
  const family = useFinanceStore((state) => state.family);
  const transactions = useFinanceStore((state) => state.transactions);
  const [selectedYear, setSelectedYear] = useState(String(dayjs().year()));

  const yearTransactions = useMemo(
    () => transactions.filter((item) => dayjs(item.date).year() === Number(selectedYear)),
    [selectedYear, transactions],
  );
  const summary = buildFinanceSummary(yearTransactions, {
    year: Number(selectedYear),
    month: null
  });
  const categories = buildCategoryBreakdown(yearTransactions);
  const users = buildUserInputSummary(yearTransactions);
  const trends = buildMonthlyTrend(yearTransactions, { year: Number(selectedYear) });
  const maxMonthlyValue = useMemo(
    () => Math.max(...trends.flatMap((item) => [item.income || 0, item.expense || 0]), 1),
    [trends],
  );
  if (!transactions.length) {
    return (
      <div className="space-y-4">
        <SectionHeading eyebrow="Laporan" title="Ringkasan, perbandingan, dan export Excel" />
        <EmptyState
          title="Belum ada laporan"
          description="Laporan akan muncul setelah transaksi mulai tercatat."
        />
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <SectionHeading eyebrow="Laporan" title="Ringkasan, perbandingan, dan export Excel" />

      <Card className="finance-card finance-soft-card">
        <div className="grid grid-cols-[1fr_auto] gap-2">
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
          <Button
            type="primary"
            size="large"
            className="mt-6"
            onClick={() =>
              exportLaporanTahunanExcel({
                year: selectedYear,
                transactions,
                familyName: family?.name
              })
            }
          >
            Export Excel
          </Button>
        </div>

        <Typography.Paragraph className="!mb-0 !mt-3 !text-[12px] !leading-5 !text-muted">
          File Excel akan dibuat dengan 1 sheet dashboard tahunan, lalu sheet bulanan sesuai data yang memang ada.
        </Typography.Paragraph>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <MetricCard label="Pemasukan" value={summary.incomeMonth} tone="income" />
        <MetricCard label="Pengeluaran" value={summary.expenseMonth} tone="expense" />
      </div>

      <section className="space-y-2.5">
        <SectionHeading eyebrow="Kategori" title={`Kategori terbesar tahun ${selectedYear}`} />
        <SimpleBarList items={categories} colorClass="bg-expense" />
      </section>

      <section className="space-y-2.5">
        <SectionHeading eyebrow="User" title={`Perbandingan user tahun ${selectedYear}`} />
        <SimpleBarList items={users} colorClass="bg-primary" />
      </section>

      <Card className="finance-card">
        <SectionHeading eyebrow="Bulanan" title="Perbandingan antar bulan" />
        <div className="mt-3 grid gap-2.5">
          {trends.map((item) => (
            <MonthlyTrendCard key={item.month} item={item} maxValue={maxMonthlyValue} />
          ))}
        </div>
      </Card>
    </div>
  );
}

function MonthlyTrendCard({ item, maxValue }) {
  const incomePercent = Math.max(3, Math.round(((item.income || 0) / maxValue) * 100));
  const expensePercent = Math.max(3, Math.round(((item.expense || 0) / maxValue) * 100));
  const net = (item.income || 0) - (item.expense || 0);
  const isPositive = net >= 0;

  return (
    <Card size="small" className="finance-soft-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Typography.Text strong className="!text-[14px] !font-semibold !text-ink">
            {item.month}
          </Typography.Text>
          <Typography.Text className="mt-1 block !text-[11px] !text-muted">
            Net {isPositive ? "+" : "-"}{formatCompactCurrency(Math.abs(net))}
          </Typography.Text>
        </div>
        <div className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${isPositive ? "bg-income/15 text-income" : "bg-expense/15 text-expense"}`}>
          {isPositive ? "Positif" : "Negatif"}
        </div>
      </div>

      <div className="mt-3 space-y-2.5">
        <MetricRow
          label="Pemasukan"
          value={formatCurrency(item.income || 0)}
          percent={incomePercent}
          barClass="bg-income"
          valueClass="text-income"
        />
        <MetricRow
          label="Pengeluaran"
          value={formatCurrency(item.expense || 0)}
          percent={expensePercent}
          barClass="bg-expense"
          valueClass="text-expense"
        />
      </div>
    </Card>
  );
}

function MetricRow({ label, value, percent, barClass, valueClass }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <Typography.Text className="!text-[11px] !font-medium !text-muted">
          {label}
        </Typography.Text>
        <Typography.Text className={`!text-[11px] !font-semibold ${valueClass}`}>
          {value}
        </Typography.Text>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-panel">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
