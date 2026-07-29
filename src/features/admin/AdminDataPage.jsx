import { DeleteOutlined } from "@ant-design/icons";
import { Segmented, Typography } from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useConfigSection, useFormatters, usePermissions } from "../../shared/config/useAppConfig";
import { useCatalogue } from "../../shared/data/useCatalogue";
import { useMutations } from "../../shared/data/useMutations";
import { useDebounce } from "../../shared/hooks/useResponsive";
import { useFinanceStore } from "../../shared/state/useFinanceStore";
import { useAuth } from "../auth/AuthProvider";
import { Button } from "antd";
import {
  Badge,
  DataTable,
  EmptyState,
  FilterBar,
  Money,
  PageHeader,
  StatCard,
  useToast
} from "../../shared/ui";
import { toDateString } from "../../shared/utils/finance";

/**
 * Raw data console.
 *
 * Every household collection in one searchable table, for the cleanup work that
 * the feature pages intentionally don't expose (orphaned payments, duplicate
 * imports, stray test records).
 */
const SOURCES = [
  { key: "transactions", label: "Transaksi", collection: "transactions" },
  { key: "budgets", label: "Anggaran", collection: "budgets" },
  { key: "savingGoals", label: "Target tabungan", collection: "savingGoals" },
  { key: "savingContributions", label: "Setoran", collection: "savingContributions" },
  { key: "financeRecords", label: "Hutang & piutang", collection: "financeRecords" },
  { key: "financePayments", label: "Pembayaran", collection: "financePayments" },
  { key: "categories", label: "Kategori", collection: "categories" }
];

export function AdminDataPage() {
  const toast = useToast();
  const mutations = useMutations();
  const formatters = useFormatters();
  const catalogue = useCatalogue();
  const general = useConfigSection("general");
  const { profile } = useAuth();
  const { can } = usePermissions(profile?.role);

  const store = useFinanceStore();
  const [source, setSource] = useState("transactions");
  const [search, setSearch] = useState("");
  const [selectedKeys, setSelectedKeys] = useState([]);

  const debouncedSearch = useDebounce(search, 250);

  /** Flattens whichever collection is selected into one comparable shape. */
  const rows = useMemo(() => {
    const keyword = debouncedSearch.trim().toLowerCase();

    const mapped = (store[source] || []).map((item) => {
      const base = { ...item, raw: item };

      switch (source) {
        case "transactions":
          return {
            ...base,
            label: item.note || item.title || catalogue.getCategoryName(item.categoryId),
            detail: `${catalogue.getTypeLabel(item.type)} · ${catalogue.getCategoryName(item.categoryId)}`,
            amount: Number(item.amount || 0),
            type: item.type,
            date: toDateString(item.date)
          };
        case "budgets":
          return {
            ...base,
            label: item.categoryName || item.categoryId,
            detail: item.note || "Anggaran bulanan",
            amount: Number(item.monthlyLimit || 0),
            date: toDateString(item.createdAt)
          };
        case "savingGoals":
          return {
            ...base,
            label: item.name,
            detail: item.description || "Target tabungan",
            amount: Number(item.targetAmount || 0),
            date: toDateString(item.targetDate)
          };
        case "savingContributions":
          return {
            ...base,
            label: item.goalName || "Setoran",
            detail: item.note || "—",
            amount: Number(item.amount || 0),
            date: toDateString(item.date)
          };
        case "financeRecords":
          return {
            ...base,
            label: item.personName,
            detail: `${item.recordType === "debt" ? "Hutang" : "Piutang"} · ${item.description || "—"}`,
            amount: Number(item.amountInitial ?? item.amount ?? 0),
            date: toDateString(item.dueDate)
          };
        case "financePayments":
          return {
            ...base,
            label: item.personName || "Pembayaran",
            detail: item.note || "—",
            amount: Number(item.amount ?? item.paymentAmount ?? 0),
            date: toDateString(item.paymentDate)
          };
        case "categories":
          return {
            ...base,
            label: item.name,
            detail: `${catalogue.getTypeLabel(item.type)} · ${item.keywords || "tanpa kata kunci"}`,
            amount: null,
            date: toDateString(item.createdAt)
          };
        default:
          return base;
      }
    });

    return mapped
      .filter((item) => {
        if (!keyword) return true;
        return `${item.label} ${item.detail} ${item.id}`.toLowerCase().includes(keyword);
      })
      .sort((left, right) => String(right.date).localeCompare(String(left.date)));
  }, [store, source, debouncedSearch, catalogue]);

  const activeSource = SOURCES.find((item) => item.key === source);
  const canDelete = can("data.manage");

  const handleBulkDelete = () => {
    const ids = [...selectedKeys];

    toast.confirm({
      title: `Hapus ${ids.length} record?`,
      content:
        "Penghapusan di sini bersifat langsung dan tidak menyesuaikan data terkait. Gunakan hanya untuk membersihkan data yang memang salah.",
      okText: "Hapus permanen",
      danger: true,
      onOk: async () => {
        const outcome = await mutations.removeMany(activeSource.collection, ids, {
          context: activeSource.label.toLowerCase(),
          successMessage: `${ids.length} record dihapus.`
        });
        if (outcome.ok) setSelectedKeys([]);
      }
    });
  };

  const columns = [
    {
      title: "Data",
      dataIndex: "label",
      render: (value, record) => (
        <div className="min-w-0">
          <Typography.Text className="!block !truncate !font-medium !text-ink">
            {value || "—"}
          </Typography.Text>
          <Typography.Text className="!block !truncate !text-caption !text-muted">
            {record.detail}
          </Typography.Text>
        </div>
      )
    },
    {
      title: "Tanggal",
      dataIndex: "date",
      width: 140,
      sorter: (left, right) => String(left.date).localeCompare(String(right.date)),
      render: (value) => (
        <Typography.Text className="!whitespace-nowrap !text-muted">
          {value ? dayjs(value).format(general.dateFormat) : "—"}
        </Typography.Text>
      )
    },
    {
      title: "Nominal",
      dataIndex: "amount",
      width: 160,
      align: "right",
      sorter: (left, right) => (left.amount || 0) - (right.amount || 0),
      render: (value, record) =>
        value === null ? (
          <Typography.Text className="!text-subtle">—</Typography.Text>
        ) : (
          <Money value={value} type={record.type} />
        )
    },
    {
      title: "ID dokumen",
      dataIndex: "id",
      width: 220,
      render: (value) => (
        <Typography.Text className="!font-mono !text-caption !text-subtle" copyable>
          {value}
        </Typography.Text>
      )
    },
    {
      title: "",
      key: "actions",
      width: 60,
      align: "right",
      render: (_, record) =>
        canDelete ? (
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() =>
              toast.confirm({
                title: "Hapus record ini?",
                content: `${record.label} (${record.id}) akan dihapus permanen.`,
                okText: "Hapus",
                danger: true,
                onOk: () =>
                  mutations.remove(activeSource.collection, record.id, {
                    context: activeSource.label.toLowerCase(),
                    successMessage: "Record dihapus."
                  })
              })
            }
            aria-label="Hapus record"
          />
        ) : null
    }
  ];

  const renderMobileCard = (record) => (
    <div className="p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Typography.Text className="!block !truncate !font-semibold !text-ink">
            {record.label || "—"}
          </Typography.Text>
          <Typography.Text className="!block !truncate !text-caption !text-muted">
            {record.detail}
          </Typography.Text>
        </div>
        {record.amount !== null ? <Money value={record.amount} type={record.type} /> : null}
      </div>
      <Typography.Text className="!mt-2 !block !font-mono !text-caption !text-subtle">
        {record.id}
      </Typography.Text>
    </div>
  );

  if (!can("data.manage")) {
    return (
      <div className="animate-fade-in">
        <PageHeader eyebrow="Pengaturan" title="Data admin" />
        <EmptyState
          title="Akses terbatas"
          description="Halaman ini hanya untuk peran dengan hak akses 'Kelola data mentah'."
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Pengaturan"
        title="Data admin"
        description="Lihat dan bersihkan data mentah dari seluruh modul. Gunakan dengan hati-hati — penghapusan di sini permanen."
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Transaksi" value={store.transactions.length} />
        <StatCard label="Kategori" value={store.categories.length} />
        <StatCard label="Anggaran" value={store.budgets.length} />
        <StatCard
          label="Hutang & piutang"
          value={store.financeRecords.length}
          helper={`${store.financePayments.length} pembayaran`}
        />
      </div>

      <div className="ds-scroll-x mb-3 pb-1">
        <Segmented
          value={source}
          onChange={(value) => {
            setSource(value);
            setSelectedKeys([]);
          }}
          options={SOURCES.map((item) => ({
            label: `${item.label} (${(store[item.key] || []).length})`,
            value: item.key
          }))}
        />
      </div>

      <FilterBar
        className="mb-4"
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari berdasarkan nama, keterangan, atau ID dokumen…"
        activeCount={search ? 1 : 0}
        onReset={() => setSearch("")}
      />

      <DataTable
        dataSource={rows}
        columns={columns}
        renderMobileCard={renderMobileCard}
        scrollX={900}
        selection={
          canDelete
            ? {
                selectedKeys,
                onChange: setSelectedKeys,
                actions: (
                  <Button size="small" danger icon={<DeleteOutlined />} onClick={handleBulkDelete}>
                    Hapus terpilih
                  </Button>
                )
              }
            : undefined
        }
        emptyState={
          <EmptyState
            title={search ? "Tidak ada yang cocok" : `Belum ada data ${activeSource?.label}`}
            description={
              search
                ? "Coba kata kunci lain, atau cari dengan ID dokumen."
                : "Data akan muncul di sini setelah dibuat dari halaman terkait."
            }
          />
        }
        footer={
          rows.length > 0 ? (
            <div className="border-t border-line px-4 py-2.5">
              <Typography.Text className="!text-caption !text-muted">
                Menampilkan {rows.length} record dari koleksi{" "}
                <code className="font-mono">{activeSource?.collection}</code>.
              </Typography.Text>
            </div>
          ) : null
        }
      />
    </div>
  );
}
