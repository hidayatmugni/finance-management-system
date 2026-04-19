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
    <div className="space-y-4">
      <SectionHeading eyebrow="Laporan" title="Ringkasan, perbandingan, dan export Excel" />

      <Card className="finance-card finance-soft-card">
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <div>
            <Typography.Text className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
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

        <Typography.Paragraph className="!mb-0 !mt-4 !text-sm !leading-6 !text-muted">
          File Excel akan dibuat dengan 1 sheet dashboard tahunan, lalu sheet bulanan sesuai data yang memang ada.
        </Typography.Paragraph>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Pemasukan" value={summary.incomeMonth} tone="income" />
        <MetricCard label="Pengeluaran" value={summary.expenseMonth} tone="expense" />
      </div>

      <section className="space-y-3">
        <SectionHeading eyebrow="Kategori" title={`Kategori terbesar tahun ${selectedYear}`} />
        <SimpleBarList items={categories} colorClass="bg-expense" />
      </section>

      <section className="space-y-3">
        <SectionHeading eyebrow="User" title={`Perbandingan user tahun ${selectedYear}`} />
        <SimpleBarList items={users} colorClass="bg-primary" />
      </section>

      <Card className="finance-card">
        <SectionHeading eyebrow="Bulanan" title="Perbandingan antar bulan" />
        <Space orientation="vertical" size={12} className="mt-4 w-full">
          {trends.map((item) => (
            <Card key={item.month} size="small" className="finance-soft-card">
              <div className="flex items-center justify-between gap-3">
                <Typography.Text strong className="!text-sm">{item.month}</Typography.Text>
                <Typography.Text className="!text-[11px] !text-muted">
                  <span className="font-semibold text-income">Pemasukan {item.income.toLocaleString("id-ID")}</span>
                  {" | "}
                  <span className="font-semibold text-expense">Keluar {item.expense.toLocaleString("id-ID")}</span>
                </Typography.Text>
              </div>
            </Card>
          ))}
        </Space>
      </Card>
    </div>
  );
}
