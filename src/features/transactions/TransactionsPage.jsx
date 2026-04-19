import dayjs from "dayjs";
import { Card, DatePicker, Form, Select, Table, Tag, Typography } from "antd";
import { useMemo } from "react";
import { useFinanceStore } from "../../shared/state/useFinanceStore";
import { EmptyState } from "../../shared/components/EmptyState";
import { SectionHeading } from "../../shared/components/SectionHeading";
import { formatCurrency, formatDate } from "../../shared/utils/format";
import { getTodayRange, inDateRange } from "../../shared/utils/dateFilters";
import { getKategoriByJenis, getJenisLabel, JENIS_ARUS_KAS, PILIHAN_JENIS_ARUS_KAS } from "../../shared/config/cashflow";

const todayRange = getTodayRange();

export function TransactionsPage() {
  const transactions = useFinanceStore((state) => state.transactions);
  const members = useFinanceStore((state) => state.members);
  const filters = useFinanceStore((state) => state.filters);
  const setFilters = useFinanceStore((state) => state.setFilters);

  const startDate = filters.startDate || todayRange.startDate;
  const endDate = filters.endDate || todayRange.endDate;

  const categoryOptions = useMemo(() => {
    if (filters.type === JENIS_ARUS_KAS.PEMASUKAN) return getKategoriByJenis(JENIS_ARUS_KAS.PEMASUKAN);
    if (filters.type === JENIS_ARUS_KAS.PENGELUARAN) return getKategoriByJenis(JENIS_ARUS_KAS.PENGELUARAN);
    return [...getKategoriByJenis(JENIS_ARUS_KAS.PENGELUARAN), ...getKategoriByJenis(JENIS_ARUS_KAS.PEMASUKAN)];
  }, [filters.type]);

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((item) => {
        const matchDate = inDateRange(item.date, startDate, endDate);
        const matchType = filters.type === "all" ? true : item.type === filters.type;
        const matchCategory = filters.categoryId === "all" ? true : item.categoryId === filters.categoryId;
        const matchMember = filters.activeMemberId === "all" ? true : item.userId === filters.activeMemberId;
        return matchDate && matchType && matchCategory && matchMember;
      }),
    [endDate, filters.activeMemberId, filters.categoryId, filters.type, startDate, transactions],
  );
  const displayTransactions = filteredTransactions.slice(0, 10);

  const totalPemasukan = filteredTransactions
    .filter((item) => item.type === JENIS_ARUS_KAS.PEMASUKAN)
    .reduce((total, item) => total + Number(item.amount || 0), 0);
  const totalPengeluaran = filteredTransactions
    .filter((item) => item.type === JENIS_ARUS_KAS.PENGELUARAN)
    .reduce((total, item) => total + Number(item.amount || 0), 0);

  if (!transactions.length) {
    return (
      <div className="space-y-4">
        <SectionHeading eyebrow="Tabel Harian" title="Ringkasan transaksi yang mudah dibaca" />
        <EmptyState
          title="Belum ada transaksi"
          description="Setelah Anda mulai input pemasukan atau pengeluaran, tabel harian akan tampil di sini."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionHeading eyebrow="Tabel Harian" title="Ringkasan transaksi yang mudah dibaca" />

      <Card className="finance-card finance-soft-card">
        <Form layout="vertical" component={false}>
          <Field label="Rentang tanggal">
            <div className="grid grid-cols-2 gap-2">
              <DatePicker
                className="!w-full"
                size="large"
                format="DD MMM YYYY"
                placeholder="Tanggal mulai"
                value={startDate ? dayjs(startDate) : null}
                onChange={(value) =>
                  setFilters({
                    startDate: value ? value.format("YYYY-MM-DD") : "",
                    endDate
                  })
                }
              />
              <DatePicker
                className="!w-full"
                size="large"
                format="DD MMM YYYY"
                placeholder="Tanggal akhir"
                value={endDate ? dayjs(endDate) : null}
                onChange={(value) =>
                  setFilters({
                    startDate,
                    endDate: value ? value.format("YYYY-MM-DD") : ""
                  })
                }
              />
            </div>
          </Field>

          <div className="mt-3 grid grid-cols-3 gap-3">
            <Field label="Jenis">
              <Select
                value={filters.type}
                onChange={(value) =>
                  setFilters({
                    type: value,
                    categoryId: "all"
                  })
                }
                size="large"
                options={[
                  { value: "all", label: "Semua" },
                  ...PILIHAN_JENIS_ARUS_KAS.map((item) => ({ value: item.value, label: item.label }))
                ]}
              />
            </Field>

            <Field label="Kategori">
              <Select
                value={filters.categoryId}
                onChange={(value) => setFilters({ categoryId: value })}
                size="large"
                options={[
                  { value: "all", label: "Semua" },
                  ...categoryOptions.map((item) => ({ value: item.id, label: item.name }))
                ]}
              />
            </Field>

            <Field label="User">
              <Select
                value={filters.activeMemberId}
                onChange={(value) => setFilters({ activeMemberId: value })}
                size="large"
                options={[
                  { value: "all", label: "Semua" },
                  ...members.map((member) => ({
                    value: member.id,
                    label: member.fullName || member.name
                  }))
                ]}
              />
            </Field>
          </div>
        </Form>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <SummaryCard label="Total pemasukan" value={formatCurrency(totalPemasukan)} />
        <SummaryCard label="Total pengeluaran" value={formatCurrency(totalPengeluaran)} />
      </div>

      <Card className="finance-card" styles={{ body: { padding: 0, overflow: "hidden" } }}>
        <Table
          size="small"
          rowKey="id"
          pagination={false}
          scroll={{ x: 760, y: 420 }}
          dataSource={displayTransactions}
          locale={{ emptyText: "Tidak ada data pada filter yang dipilih." }}
          columns={[
            {
              title: "Tanggal",
              dataIndex: "date",
              width: 110,
              render: (value) => formatDate(value)
            },
            {
              title: "Nominal",
              dataIndex: "amount",
              width: 130,
              align: "right",
              render: (value, item) => (
                <Typography.Text strong className={item.type === JENIS_ARUS_KAS.PEMASUKAN ? "!text-income" : "!text-expense"}>
                  {formatCurrency(value)}
                </Typography.Text>
              )
            },
            {
              title: "User",
              dataIndex: "memberName",
              width: 120,
              render: (value) => truncateText(value, 16)
            },
            {
              title: "Jenis",
              dataIndex: "type",
              width: 110,
              render: (value) => (
                <Tag className={value === JENIS_ARUS_KAS.PEMASUKAN ? "finance-chip finance-chip-income" : "finance-chip finance-chip-expense"}>
                  {getJenisLabel(value)}
                </Tag>
              )
            },
            {
              title: "Kategori",
              dataIndex: "categoryName",
              width: 120
            },
            
          ]}
        />
      </Card>
    </div>
  );
}

function truncateText(value, maxLength) {
  if (!value) return "-";
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function Field({ label, children }) {
  return (
    <Form.Item
      label={<span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{label}</span>}
      className="!mb-0"
    >
      {children}
    </Form.Item>
  );
}

function SummaryCard({ label, value }) {
  return (
    <Card className="finance-card finance-soft-card">
      <Typography.Text className="metric-label text-[10px]">{label}</Typography.Text>
      <Typography.Title level={4} className="!mb-0 !mt-2 !text-lg !font-extrabold">
        {value}
      </Typography.Title>
    </Card>
  );
}
