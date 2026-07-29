import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, DatePicker, Input, Segmented, Typography } from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useConfigSection, useFormatters } from "../../shared/config/useAppConfig";
import { renderIcon } from "../../shared/config/iconRegistry";
import { useCatalogue } from "../../shared/data/useCatalogue";
import { useMutations } from "../../shared/data/useMutations";
import { useDebounce } from "../../shared/hooks/useResponsive";
import { useFinanceStore } from "../../shared/state/useFinanceStore";
import {
  Badge,
  DataTable,
  EmptyState,
  Field,
  FilterBar,
  Money,
  MoneyField,
  MultiSelect,
  PageHeader,
  ResponsiveDialog,
  SearchSelect,
  StatCard,
  useToast
} from "../../shared/ui";
import { buildRangePresets, getCurrentBookMonthRange } from "../../shared/utils/dateFilters";
import { buildSummary, filterByRange, toDateString } from "../../shared/utils/finance";

const { RangePicker } = DatePicker;

/**
 * Transaction ledger.
 *
 * Filtering happens in memory over the live snapshot — the dataset is a
 * household's transactions, small enough that a round trip per filter change
 * would cost more than it saves, and this way filters feel instant.
 */
export function TransactionsPage() {
  const toast = useToast();
  const mutations = useMutations();
  const formatters = useFormatters();
  const catalogue = useCatalogue();
  const general = useConfigSection("general");

  const transactions = useFinanceStore((state) => state.transactions);
  const loading = useFinanceStore((state) => state.loading.transactions);
  const removeLocal = useFinanceStore((state) => state.removeTransactionLocal);
  const restore = useFinanceStore((state) => state.restoreTransactions);

  const defaultRange = useMemo(() => {
    const period = getCurrentBookMonthRange(general);
    return [dayjs(period.startDate), dayjs(period.endDate)];
  }, [general]);

  const [range, setRange] = useState(defaultRange);
  const [type, setType] = useState("all");
  const [categoryIds, setCategoryIds] = useState([]);
  const [memberIds, setMemberIds] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const debouncedSearch = useDebounce(search, 250);

  const rows = useMemo(() => {
    const keyword = debouncedSearch.trim().toLowerCase();
    const [start, end] = range;

    return filterByRange(transactions, start?.format("YYYY-MM-DD"), end?.format("YYYY-MM-DD"))
      .filter((item) => type === "all" || item.type === type)
      .filter((item) => categoryIds.length === 0 || categoryIds.includes(item.categoryId))
      .filter((item) => memberIds.length === 0 || memberIds.includes(item.userId))
      .filter((item) => {
        if (!keyword) return true;
        const haystack = [
          item.note,
          item.title,
          item.categoryName,
          catalogue.getCategoryName(item.categoryId)
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(keyword);
      })
      .map((item) => ({ ...item, date: toDateString(item.date) }))
      .sort((left, right) => right.date.localeCompare(left.date));
  }, [transactions, range, type, categoryIds, memberIds, debouncedSearch, catalogue]);

  const summary = useMemo(() => buildSummary(rows), [rows]);

  const activeFilterCount =
    (type !== "all" ? 1 : 0) + categoryIds.length + memberIds.length + (search ? 1 : 0);

  const resetFilters = () => {
    setRange(defaultRange);
    setType("all");
    setCategoryIds([]);
    setMemberIds([]);
    setSearch("");
  };

  /** Optimistic delete with a window to undo, instead of a confirm dialog. */
  const handleDelete = (record) => {
    const snapshot = transactions;
    removeLocal(record.id);

    toast.undoable({
      description: `Transaksi ${formatters.currency(record.amount)} dihapus.`,
      rollback: () => restore(snapshot),
      commit: () =>
        mutations.remove("transactions", record.id, { context: "transaksi" }).then((outcome) => {
          if (!outcome.ok) restore(snapshot);
        })
    });
  };

  const handleBulkDelete = () => {
    const snapshot = transactions;
    const ids = [...selectedKeys];
    ids.forEach((id) => removeLocal(id));
    setSelectedKeys([]);

    toast.undoable({
      description: `${ids.length} transaksi dihapus.`,
      rollback: () => restore(snapshot),
      commit: () =>
        mutations.removeMany("transactions", ids, { context: "transaksi" }).then((outcome) => {
          if (!outcome.ok) restore(snapshot);
        })
    });
  };

  const openEdit = (record) => {
    setEditing(record);
    setEditForm({
      type: record.type,
      amount: Number(record.amount) || null,
      categoryId: record.categoryId || "",
      note: record.note || "",
      date: record.date
    });
  };

  const handleUpdate = async () => {
    if (!editForm.amount || Number(editForm.amount) <= 0) {
      toast.warning("Nominal harus lebih dari 0.");
      return;
    }

    const category = catalogue.getCategory(editForm.categoryId);
    setSubmitting(true);
    const outcome = await mutations.update(
      "transactions",
      editing.id,
      {
        type: editForm.type,
        amount: Number(editForm.amount),
        categoryId: editForm.categoryId || null,
        categoryName: category?.name || null,
        note: editForm.note.trim(),
        title: editForm.note.trim() || category?.name || editForm.type,
        date: editForm.date
      },
      { context: "transaksi", successMessage: "Transaksi diperbarui." },
    );
    setSubmitting(false);

    if (outcome.ok) setEditing(null);
  };

  const columns = [
    {
      title: "Tanggal",
      dataIndex: "date",
      width: 120,
      sorter: (left, right) => left.date.localeCompare(right.date),
      render: (value) => (
        <Typography.Text className="!whitespace-nowrap !text-muted">
          {dayjs(value).format(general.dateFormat)}
        </Typography.Text>
      )
    },
    {
      title: "Keterangan",
      dataIndex: "note",
      render: (value, record) => (
        <div className="min-w-0">
          <Typography.Text className="!block !truncate !font-medium !text-ink">
            {value || catalogue.getCategoryName(record.categoryId)}
          </Typography.Text>
          <Typography.Text className="!block !truncate !text-caption !text-muted">
            {catalogue.getMemberName(record.userId)}
          </Typography.Text>
        </div>
      )
    },
    {
      title: "Kategori",
      dataIndex: "categoryId",
      width: 170,
      render: (value) => {
        const category = catalogue.getCategory(value);
        return category ? (
          <Badge color={category.color}>{category.name}</Badge>
        ) : (
          <Typography.Text className="!text-subtle">Tanpa kategori</Typography.Text>
        );
      }
    },
    {
      title: "Jenis",
      dataIndex: "type",
      width: 120,
      render: (value) => (
        <Badge tone={value === "income" ? "success" : "danger"}>
          {catalogue.getTypeLabel(value)}
        </Badge>
      )
    },
    {
      title: "Nominal",
      dataIndex: "amount",
      width: 160,
      align: "right",
      sorter: (left, right) => left.amount - right.amount,
      render: (value, record) => <Money value={value} type={record.type} />
    },
    {
      title: "",
      key: "actions",
      width: 88,
      align: "right",
      render: (_, record) => (
        <div className="flex justify-end gap-1">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={(event) => {
              event.stopPropagation();
              openEdit(record);
            }}
            aria-label="Ubah transaksi"
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={(event) => {
              event.stopPropagation();
              handleDelete(record);
            }}
            aria-label="Hapus transaksi"
          />
        </div>
      )
    }
  ];

  const renderMobileCard = (record, { selected, toggleSelected }) => {
    const category = catalogue.getCategory(record.categoryId);

    return (
      <div className="flex items-center gap-3 p-3.5">
        <button
          type="button"
          onClick={toggleSelected}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-[16px]"
          style={{
            backgroundColor: selected
              ? undefined
              : category?.color
                ? `${category.color}1F`
                : undefined,
            color: category?.color
          }}
          aria-label="Pilih transaksi"
        >
          {renderIcon(category?.icon || "tag")}
        </button>

        <div className="min-w-0 flex-1">
          <Typography.Text className="!block !truncate !font-medium !text-ink">
            {record.note || catalogue.getCategoryName(record.categoryId)}
          </Typography.Text>
          <Typography.Text className="!block !truncate !text-caption !text-muted">
            {dayjs(record.date).format(general.dateFormat)} ·{" "}
            {catalogue.getCategoryName(record.categoryId)}
          </Typography.Text>
        </div>

        <Money value={record.amount} type={record.type} className="shrink-0" />
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Catatan"
        title="Transaksi"
        description={`${rows.length} transaksi pada rentang terpilih`}
        actions={
          <Link to="/dashboard/add">
            <Button type="primary" icon={<PlusOutlined />}>
              Catat transaksi
            </Button>
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Jumlah transaksi" value={rows.length} loading={loading} />
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
      </div>

      <FilterBar
        className="mb-4"
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari keterangan atau kategori…"
        activeCount={activeFilterCount}
        onReset={resetFilters}
      >
        <Field label="Rentang tanggal">
          <RangePicker
            value={range}
            onChange={(value) => value && setRange(value)}
            format={general.dateFormat}
            presets={buildRangePresets(general)}
            allowClear={false}
            className="!w-full md:!w-[260px]"
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
            className="md:!w-[200px]"
          />
        </Field>

        <Field label="Anggota">
          <MultiSelect
            size="middle"
            value={memberIds}
            onChange={setMemberIds}
            options={catalogue.memberOptions}
            className="md:!w-[180px]"
          />
        </Field>
      </FilterBar>

      <DataTable
        dataSource={rows}
        columns={columns}
        renderMobileCard={renderMobileCard}
        loading={loading}
        scrollX={940}
        onRowClick={openEdit}
        selection={{
          selectedKeys,
          onChange: setSelectedKeys,
          actions: (
            <Button size="small" danger icon={<DeleteOutlined />} onClick={handleBulkDelete}>
              Hapus terpilih
            </Button>
          )
        }}
        emptyState={
          <EmptyState
            title={activeFilterCount > 0 ? "Tidak ada yang cocok" : "Belum ada transaksi"}
            description={
              activeFilterCount > 0
                ? "Longgarkan filter atau perlebar rentang tanggalnya."
                : "Mulai catat pemasukan dan pengeluaran untuk melihat riwayatnya di sini."
            }
            action={
              activeFilterCount > 0 ? (
                <Button onClick={resetFilters}>Reset filter</Button>
              ) : (
                <Link to="/dashboard/add">
                  <Button type="primary" icon={<PlusOutlined />}>
                    Catat transaksi
                  </Button>
                </Link>
              )
            }
          />
        }
      />

      <ResponsiveDialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        onSubmit={handleUpdate}
        submitting={submitting}
        title="Ubah transaksi"
      >
        {editForm ? (
          <>
            <Segmented
              block
              className="ds-segmented-lg"
              value={editForm.type}
              onChange={(value) => setEditForm({ ...editForm, type: value, categoryId: "" })}
              options={catalogue.transactionTypes.map((item) => ({
                label: item.label,
                value: item.id
              }))}
            />

            <Field label="Nominal" required>
              <MoneyField
                value={editForm.amount}
                onChange={(value) => setEditForm({ ...editForm, amount: value })}
                currencySymbol={general.currencySymbol}
                locale={general.locale}
              />
            </Field>

            <Field label="Kategori">
              <SearchSelect
                options={catalogue.categoryOptions(editForm.type)}
                value={editForm.categoryId}
                onChange={(value) => setEditForm({ ...editForm, categoryId: value })}
                allowClear
              />
            </Field>

            <Field label="Keterangan" optional>
              <Input
                size="large"
                value={editForm.note}
                onChange={(event) => setEditForm({ ...editForm, note: event.target.value })}
                maxLength={120}
              />
            </Field>

            <Field label="Tanggal" required>
              <DatePicker
                size="large"
                className="!w-full"
                format={general.dateFormat}
                allowClear={false}
                value={editForm.date ? dayjs(editForm.date) : null}
                onChange={(value) =>
                  setEditForm({ ...editForm, date: value ? value.format("YYYY-MM-DD") : "" })
                }
              />
            </Field>
          </>
        ) : null}
      </ResponsiveDialog>
    </div>
  );
}
