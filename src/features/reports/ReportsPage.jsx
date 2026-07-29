import { FileExcelOutlined } from "@ant-design/icons";
import { Button, DatePicker, Segmented, Tabs, Typography } from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useConfigSection, useFormatters, usePermissions } from "../../shared/config/useAppConfig";
import { useCatalogue } from "../../shared/data/useCatalogue";
import { useTheme } from "../../shared/design/ThemeProvider";
import { useFinanceStore } from "../../shared/state/useFinanceStore";
import { useAuth } from "../auth/AuthProvider";
import {
  Badge,
  DataTable,
  DonutChart,
  EmptyState,
  Field,
  Money,
  PageHeader,
  ProgressMeter,
  RankedBarList,
  SectionCard,
  StatCard,
  TrendChart,
  MultiSelect,
  useToast
} from "../../shared/ui";
import { buildRangePresets, getCurrentBookMonthRange } from "../../shared/utils/dateFilters";
import {
  buildBudgetUsage,
  buildCategoryBreakdown,
  buildDailySeries,
  buildMemberBreakdown,
  buildMonthlySeries,
  buildSummary,
  filterByRange
} from "../../shared/utils/finance";

const { RangePicker } = DatePicker;

/** Analytical views over the ledger, plus the Excel export. */
export function ReportsPage() {
  const toast = useToast();
  const formatters = useFormatters();
  const catalogue = useCatalogue();
  const { colors } = useTheme();
  const { profile } = useAuth();
  const { can } = usePermissions(profile?.role);

  const general = useConfigSection("general");
  const notifications = useConfigSection("notifications");

  const transactions = useFinanceStore((state) => state.transactions);
  const budgets = useFinanceStore((state) => state.budgets);
  const members = useFinanceStore((state) => state.members);
  const family = useFinanceStore((state) => state.family);
  const loading = useFinanceStore((state) => state.loading.transactions);

  const defaultRange = useMemo(() => {
    const period = getCurrentBookMonthRange(general);
    return [dayjs(period.startDate), dayjs(period.endDate)];
  }, [general]);

  const [range, setRange] = useState(defaultRange);
  const [type, setType] = useState("all");
  const [categoryIds, setCategoryIds] = useState([]);
  const [exporting, setExporting] = useState(false);

  const filtered = useMemo(() => {
    const [start, end] = range;
    return filterByRange(transactions, start?.format("YYYY-MM-DD"), end?.format("YYYY-MM-DD"))
      .filter((item) => type === "all" || item.type === type)
      .filter((item) => categoryIds.length === 0 || categoryIds.includes(item.categoryId));
  }, [transactions, range, type, categoryIds]);

  const summary = useMemo(() => buildSummary(filtered), [filtered]);

  const dailySeries = useMemo(
    () => buildDailySeries(filtered, range[0]?.format("YYYY-MM-DD"), range[1]?.format("YYYY-MM-DD")),
    [filtered, range],
  );

  const monthlySeries = useMemo(
    () => buildMonthlySeries(transactions, range[1]?.year() || dayjs().year(), general),
    [transactions, range, general],
  );

  const expenseByCategory = useMemo(
    () => buildCategoryBreakdown(filtered, catalogue.categories, "expense"),
    [filtered, catalogue.categories],
  );

  const incomeByCategory = useMemo(
    () => buildCategoryBreakdown(filtered, catalogue.categories, "income"),
    [filtered, catalogue.categories],
  );

  const memberBreakdown = useMemo(
    () => buildMemberBreakdown(filtered, members),
    [filtered, members],
  );

  const budgetPerformance = useMemo(
    () => buildBudgetUsage(budgets, filtered, catalogue.categories, notifications.budgetAlertThreshold),
    [budgets, filtered, catalogue.categories, notifications.budgetAlertThreshold],
  );

  /**
   * The Excel writer is heavy (ExcelJS), so it is imported only when the user
   * actually exports — it never lands in the initial bundle.
   */
  const handleExport = async () => {
    setExporting(true);
    try {
      const { exportLaporanTahunanExcel } = await import("../../shared/utils/excelExport");
      await exportLaporanTahunanExcel({
        year: range[1]?.year() || dayjs().year(),
        transactions: filtered,
        familyName: family?.name || general.appName
      });
      toast.success("Laporan Excel berhasil dibuat.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal membuat file Excel.");
    } finally {
      setExporting(false);
    }
  };

  const tabs = [
    {
      key: "trend",
      label: "Tren",
      children: (
        <div className="grid gap-4 xl:grid-cols-2">
          <SectionCard title="Arus kas harian" description="Rentang terpilih">
            <TrendChart
              data={dailySeries}
              series={[
                { key: "income", label: "Masuk", color: colors.income },
                { key: "expense", label: "Keluar", color: colors.expense }
              ]}
              valueFormatter={formatters.currency}
              axisFormatter={formatters.compact}
            />
          </SectionCard>

          <SectionCard title="Saldo kumulatif" description="Akumulasi arus kas bersih">
            <TrendChart
              variant="line"
              data={dailySeries}
              series={[{ key: "cumulative", label: "Saldo", color: colors.primary }]}
              valueFormatter={formatters.currency}
              axisFormatter={formatters.compact}
              showLegend={false}
            />
          </SectionCard>

          <SectionCard
            title="Perbandingan bulanan"
            description={`Tahun ${range[1]?.year() || dayjs().year()}`}
            className="xl:col-span-2"
          >
            <TrendChart
              variant="bar"
              data={monthlySeries}
              series={[
                { key: "income", label: "Masuk", color: colors.income },
                { key: "expense", label: "Keluar", color: colors.expense }
              ]}
              valueFormatter={formatters.currency}
              axisFormatter={formatters.compact}
            />
          </SectionCard>
        </div>
      )
    },
    {
      key: "category",
      label: "Kategori",
      children: (
        <div className="grid gap-4 xl:grid-cols-2">
          <SectionCard title="Pengeluaran per kategori">
            {expenseByCategory.length === 0 ? (
              <EmptyState compact title="Tidak ada pengeluaran" description={null} />
            ) : (
              <>
                <DonutChart
                  data={expenseByCategory.slice(0, 7)}
                  valueFormatter={formatters.currency}
                  centerLabel="Total"
                  centerValue={formatters.compact(summary.expense)}
                />
                <div className="mt-4">
                  <RankedBarList
                    items={expenseByCategory}
                    valueFormatter={formatters.compact}
                    max={8}
                  />
                </div>
              </>
            )}
          </SectionCard>

          <SectionCard title="Pemasukan per kategori">
            {incomeByCategory.length === 0 ? (
              <EmptyState compact title="Tidak ada pemasukan" description={null} />
            ) : (
              <>
                <DonutChart
                  data={incomeByCategory.slice(0, 7)}
                  valueFormatter={formatters.currency}
                  centerLabel="Total"
                  centerValue={formatters.compact(summary.income)}
                />
                <div className="mt-4">
                  <RankedBarList
                    items={incomeByCategory}
                    valueFormatter={formatters.compact}
                    max={8}
                  />
                </div>
              </>
            )}
          </SectionCard>
        </div>
      )
    },
    {
      key: "budget",
      label: "Anggaran",
      children: (
        <DataTable
          dataSource={budgetPerformance}
          showPagination={false}
          scrollX={760}
          columns={[
            { title: "Kategori", dataIndex: "categoryName" },
            {
              title: "Limit",
              dataIndex: "limit",
              width: 150,
              align: "right",
              render: (value) => formatters.currency(value)
            },
            {
              title: "Terpakai",
              dataIndex: "spent",
              width: 150,
              align: "right",
              render: (value) => formatters.currency(value)
            },
            {
              title: "Selisih",
              dataIndex: "remaining",
              width: 150,
              align: "right",
              render: (value) => (
                <Money value={Math.abs(value)} type={value >= 0 ? "income" : "expense"} />
              )
            },
            {
              title: "Progress",
              key: "progress",
              width: 220,
              render: (_, record) => (
                <ProgressMeter
                  value={record.spent}
                  max={record.limit}
                  size="sm"
                  warningAt={notifications.budgetAlertThreshold}
                />
              )
            }
          ]}
          emptyState={
            <EmptyState
              title="Belum ada anggaran"
              description="Buat anggaran per kategori untuk melihat performanya di sini."
            />
          }
        />
      )
    },
    {
      key: "member",
      label: "Anggota",
      children: (
        <DataTable
          dataSource={memberBreakdown}
          rowKey="id"
          showPagination={false}
          scrollX={640}
          columns={[
            { title: "Anggota", dataIndex: "name" },
            {
              title: "Transaksi",
              dataIndex: "count",
              width: 130,
              align: "right",
              sorter: (left, right) => left.count - right.count
            },
            {
              title: "Pemasukan",
              dataIndex: "income",
              width: 170,
              align: "right",
              render: (value) => <Money value={value} type="income" />
            },
            {
              title: "Pengeluaran",
              dataIndex: "expense",
              width: 170,
              align: "right",
              sorter: (left, right) => left.expense - right.expense,
              render: (value) => <Money value={value} type="expense" />
            }
          ]}
          emptyState={<EmptyState title="Belum ada data anggota" description={null} />}
        />
      )
    }
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Analisa"
        title="Laporan"
        description="Pilih rentang, lalu telusuri tren, kategori, anggaran dan kontribusi anggota."
        actions={
          can("report.export") ? (
            <Button icon={<FileExcelOutlined />} loading={exporting} onClick={handleExport}>
              Export Excel
            </Button>
          ) : null
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Pemasukan"
          value={formatters.compact(summary.income)}
          tone="success"
          loading={loading}
        />
        <StatCard
          label="Pengeluaran"
          value={formatters.compact(summary.expense)}
          tone="danger"
          loading={loading}
        />
        <StatCard
          label="Arus kas bersih"
          value={formatters.compact(summary.net)}
          tone={summary.net >= 0 ? "success" : "danger"}
          loading={loading}
        />
        <StatCard
          label="Rasio menabung"
          value={formatters.percent(summary.savingRate)}
          tone={summary.savingRate >= 20 ? "success" : "warning"}
          helper={`${summary.count} transaksi`}
          loading={loading}
        />
      </div>

      <div className="ds-card mb-4 p-3">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Rentang">
            <RangePicker
              value={range}
              onChange={(value) => value && setRange(value)}
              format={general.dateFormat}
              presets={buildRangePresets(general)}
              allowClear={false}
              className="!w-full sm:!w-[280px]"
            />
          </Field>

          <Field label="Jenis">
            <Segmented
              value={type}
              onChange={setType}
              options={[
                { label: "Semua", value: "all" },
                ...catalogue.transactionTypes.map((item) => ({
                  label: item.label,
                  value: item.id
                }))
              ]}
            />
          </Field>

          <Field label="Kategori">
            <MultiSelect
              size="middle"
              value={categoryIds}
              onChange={setCategoryIds}
              options={catalogue.categoryOptions()}
              className="sm:!w-[220px]"
            />
          </Field>

          <Typography.Text className="!ml-auto !text-caption !text-muted">
            <Badge tone="neutral">{filtered.length} transaksi</Badge>
          </Typography.Text>
        </div>
      </div>

      <Tabs items={tabs} />
    </div>
  );
}
