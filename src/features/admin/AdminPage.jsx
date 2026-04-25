import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Input, Modal, Popconfirm, Select, Space, Table, Tag, Typography } from "antd";
import { useFinanceStore } from "../../shared/state/useFinanceStore";
import { SectionHeading } from "../../shared/components/SectionHeading";
import { EmptyState } from "../../shared/components/EmptyState";
import { formatCurrency, formatDate } from "../../shared/utils/format";
import { themePalette } from "../../shared/config/themePalette";
import { deleteTransaction } from "../../shared/firebase/firestoreTransactions";
import {
  deleteFinancePayment,
  deleteFinanceRecord,
  deleteSavingContribution,
  deleteSavingGoal,
  updateFinanceRecord,
  updateSavingGoal
} from "../../shared/firebase/firestoreHousehold";

const RECORD_TYPE_OPTIONS = [
  { value: "all", label: "Semua data" },
  { value: "transaction", label: "Transaksi" },
  { value: "saving-goal", label: "Target tabungan" },
  { value: "saving-contribution", label: "Setoran tabungan" },
  { value: "finance-record", label: "Hutang / piutang" },
  { value: "finance-payment", label: "Pembayaran hutang / piutang" }
];

export function AdminPage() {
  const family = useFinanceStore((state) => state.family);
  const members = useFinanceStore((state) => state.members);
  const transactions = useFinanceStore((state) => state.transactions);
  const savingsGoals = useFinanceStore((state) => state.savingsGoals);
  const savingContributions = useFinanceStore((state) => state.savingContributions);
  const financeRecords = useFinanceStore((state) => state.financeRecords);
  const financePayments = useFinanceStore((state) => state.financePayments);

  const [query, setQuery] = useState("");
  const [recordType, setRecordType] = useState("all");
  const [memberFilter, setMemberFilter] = useState("all");
  const [submitAlert, setSubmitAlert] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    if (!submitAlert) return undefined;
    const timeoutId = window.setTimeout(() => setSubmitAlert(null), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [submitAlert]);

  const allRecords = useMemo(() => {
    const savingGoalMap = Object.fromEntries(savingsGoals.map((item) => [item.id, item]));
    const financeRecordMap = Object.fromEntries(financeRecords.map((item) => [item.id, item]));

    return [
      ...transactions.map((item) => ({
        id: item.id,
        entityType: "transaction",
        moduleLabel: "Transaksi",
        title: item.title || item.note || item.categoryName || "Transaksi",
        subtitle: `${item.categoryName || "-"} | ${item.type === "income" ? "Pemasukan" : "Pengeluaran"}`,
        amount: Number(item.amount || 0),
        date: item.date,
        userId: item.userId || "",
        userName: item.memberName || "-",
        status: item.syncStatus || "",
        raw: item
      })),
      ...savingsGoals.map((item) => ({
        id: item.id,
        entityType: "saving-goal",
        moduleLabel: "Target tabungan",
        title: item.name,
        subtitle: `Target ${formatCurrency(item.targetAmount || 0)}`,
        amount: Number(item.targetAmount || 0),
        date: item.targetDate,
        userId: item.userId || "",
        userName: getMemberName(item.userId, members),
        status: item.status || "",
        raw: item
      })),
      ...savingContributions.map((item) => ({
        id: item.id,
        entityType: "saving-contribution",
        moduleLabel: "Setoran tabungan",
        title: savingGoalMap[item.savingGoalId]?.name || "Setoran tabungan",
        subtitle: item.note || "Riwayat setoran",
        amount: Number(item.amount || 0),
        date: item.date,
        userId: item.userId || "",
        userName: getMemberName(item.userId, members),
        status: "",
        raw: item
      })),
      ...financeRecords.map((item) => ({
        id: item.id,
        entityType: "finance-record",
        moduleLabel: item.recordType === "debt" ? "Hutang" : "Piutang",
        title: item.personName,
        subtitle: `${item.recordType === "debt" ? "Pokok hutang" : "Pokok piutang"} | Sisa ${formatCurrency(item.amountRemaining || 0)}`,
        amount: Number(item.amountInitial || 0),
        date: item.startDate || item.dueDate,
        userId: item.userId || "",
        userName: getMemberName(item.userId, members),
        status: item.status || "",
        raw: item
      })),
      ...financePayments.map((item) => ({
        id: item.id,
        entityType: "finance-payment",
        moduleLabel: financeRecordMap[item.financeRecordId]?.recordType === "debt" ? "Bayar hutang" : "Pelunasan piutang",
        title: financeRecordMap[item.financeRecordId]?.personName || "Pembayaran",
        subtitle: item.note || `Pembayaran ke-${item.paymentNumber || "-"}`,
        amount: Number(item.amount || 0),
        date: item.paymentDate,
        userId: item.userId || "",
        userName: getMemberName(item.userId, members),
        status: "",
        raw: item
      }))
    ].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  }, [financePayments, financeRecords, members, savingContributions, savingsGoals, transactions]);

  const filteredRecords = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return allRecords.filter((item) => {
      const matchType = recordType === "all" ? true : item.entityType === recordType;
      const matchMember = memberFilter === "all" ? true : item.userId === memberFilter;
      const matchQuery = !keyword
        ? true
        : [item.title, item.subtitle, item.moduleLabel, item.userName, item.status, item.date]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(keyword);

      return matchType && matchMember && matchQuery;
    });
  }, [allRecords, memberFilter, query, recordType]);

  const handleDelete = async (record) => {
    if (!family?.id) return;

    setSubmitAlert(null);
    setDeletingId(record.id);

    try {
      if (record.entityType === "transaction") {
        await deleteTransaction({ familyId: family.id, transactionId: record.id });
      }

      if (record.entityType === "saving-goal") {
        const relatedContributions = savingContributions.filter((item) => item.savingGoalId === record.id);
        if (relatedContributions.length) {
          throw new Error("Hapus dulu riwayat setoran target ini sebelum menghapus target tabungan.");
        }

        await deleteSavingGoal(family.id, record.id);
      }

      if (record.entityType === "saving-contribution") {
        const contribution = record.raw;
        const goal = savingsGoals.find((item) => item.id === contribution.savingGoalId);

        if (goal) {
          const nextCurrentAmount = Math.max(Number(goal.currentAmount || 0) - Number(contribution.amount || 0), 0);
          const nextStatus = goal.status === "paused"
            ? "paused"
            : nextCurrentAmount >= Number(goal.targetAmount || 0)
              ? "completed"
              : "active";

          await updateSavingGoal(family.id, goal.id, {
            currentAmount: nextCurrentAmount,
            status: nextStatus
          });
        }

        await deleteSavingContribution(family.id, contribution.id);

        const linkedTransaction = transactions.find(
          (item) =>
            item.sourceModule === "savings" &&
            item.relatedSavingGoalId === contribution.savingGoalId &&
            Number(item.amount || 0) === Number(contribution.amount || 0) &&
            item.date === contribution.date,
        );

        if (linkedTransaction) {
          await deleteTransaction({ familyId: family.id, transactionId: linkedTransaction.id });
        }
      }

      if (record.entityType === "finance-record") {
        const relatedPayments = financePayments.filter((item) => item.financeRecordId === record.id);
        if (relatedPayments.length) {
          throw new Error("Hapus dulu riwayat pembayaran record ini sebelum menghapus pokok hutang/piutang.");
        }

        await deleteFinanceRecord(family.id, record.id);

        const initialTransaction = transactions.find(
          (item) =>
            item.relatedFinanceRecordId === record.id &&
            item.sourceModule === "finance-record" &&
            Array.isArray(item.tags) &&
            item.tags.some((tag) => tag === "hutang_awal" || tag === "piutang_awal"),
        );

        if (initialTransaction) {
          await deleteTransaction({ familyId: family.id, transactionId: initialTransaction.id });
        }
      }

      if (record.entityType === "finance-payment") {
        const payment = record.raw;
        const financeRecord = financeRecords.find((item) => item.id === payment.financeRecordId);

        if (financeRecord) {
          const nextTotalPaid = Math.max(Number(financeRecord.totalPaid || 0) - Number(payment.amount || 0), 0);
          const nextRemaining = Math.max(Number(financeRecord.amountInitial || 0) - nextTotalPaid, 0);
          const nextPaymentCount = Math.max(Number(financeRecord.paymentCount || 0) - 1, 0);
          const nextStatus = nextRemaining <= 0 ? "paid" : "active";

          await updateFinanceRecord(family.id, financeRecord.id, {
            totalPaid: nextTotalPaid,
            amountRemaining: nextRemaining,
            paymentCount: nextPaymentCount,
            status: nextStatus
          });
        }

        await deleteFinancePayment(family.id, payment.id);

        const linkedTransaction = transactions.find(
          (item) =>
            item.relatedFinanceRecordId === payment.financeRecordId &&
            item.sourceModule === "finance-record" &&
            Number(item.amount || 0) === Number(payment.amount || 0) &&
            item.date === payment.paymentDate &&
            Array.isArray(item.tags) &&
            item.tags.some((tag) => tag === "pembayaran_hutang" || tag === "pelunasan_piutang"),
        );

        if (linkedTransaction) {
          await deleteTransaction({ familyId: family.id, transactionId: linkedTransaction.id });
        }
      }

      setSubmitAlert({
        type: "success",
        title: "Record berhasil dihapus."
      });
      setSelectedRecord(null);
    } catch (error) {
      setSubmitAlert({
        type: "error",
        title: error instanceof Error ? error.message : "Gagal menghapus record."
      });
    } finally {
      setDeletingId("");
    }
  };

  if (!family?.id) {
    return (
      <EmptyState
        title="Data keluarga belum siap"
        description="Tunggu data keluarga termuat sebelum membuka admin data."
      />
    );
  }

  return (
    <div className="space-y-2.5">
      <SectionHeading eyebrow="Admin Data" title="Cari, filter, dan hapus record salah input" />

      <Card className="finance-card finance-soft-card">
        <Space orientation="vertical" size={10} className="w-full">
          {submitAlert ? (
            <Alert
              type={submitAlert.type}
              showIcon
              title={submitAlert.title}
              closable={{ closeIcon: true, onClose: () => setSubmitAlert(null), "aria-label": "close" }}
            />
          ) : null}

          <Input
            size="large"
            placeholder="Cari nama, catatan, user, tanggal, atau jenis data"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          <div className="grid grid-cols-2 gap-2">
            <Select
              size="large"
              value={recordType}
              onChange={setRecordType}
              options={RECORD_TYPE_OPTIONS}
            />
            <Select
              size="large"
              value={memberFilter}
              onChange={setMemberFilter}
              options={[
                { value: "all", label: "Semua user" },
                ...members.map((member) => ({
                  value: member.id,
                  label: member.fullName || member.name || member.email
                }))
              ]}
            />
          </div>

          <Typography.Text className="!text-[12px] !text-muted">
            Menampilkan {filteredRecords.length} record. Klik baris untuk lihat detail, lalu hapus jika memang salah input.
          </Typography.Text>
        </Space>
      </Card>

      <Card className="finance-card finance-soft-card">
        <Space size={[10, 8]} wrap>
          {RECORD_TYPE_OPTIONS.filter((item) => item.value !== "all").map((item) => (
            <Typography.Text key={item.value} className={`!text-[11px] !font-semibold ${getEntityTypeTextClass(item.value)}`}>
              {item.label}
            </Typography.Text>
          ))}
        </Space>
      </Card>

      {!filteredRecords.length ? (
        <EmptyState
          title="Tidak ada record yang cocok"
          description="Coba ubah kata kunci atau filternya agar data yang dicari muncul."
        />
      ) : null}

      {filteredRecords.length ? (
        <Card className="finance-card" styles={{ body: { padding: 0, overflow: "hidden" } }}>
          <Table
            size="small"
            rowKey={(record) => `${record.entityType}-${record.id}`}
            pagination={{
              pageSize: 12,
              size: "small",
              showSizeChanger: false
            }}
            dataSource={filteredRecords}
            onRow={(record) => ({
              onClick: () => setSelectedRecord(record)
            })}
            columns={[
              {
                title: "Data",
                dataIndex: "title",
                render: (_, item) => (
                  <div className="min-w-0">
                    <Typography.Text strong className="!block !truncate !text-[12px] !font-semibold">
                      {item.title}
                    </Typography.Text>
                    <div className="mt-1 flex items-center gap-2">
                      <Typography.Text className={`!text-[10px] !font-semibold ${getEntityTypeTextClass(item.entityType)}`}>
                        {getEntityTypeLabel(item.entityType)}
                      </Typography.Text>
                    </div>
                  </div>
                )
              },
              {
                title: "Tgl",
                dataIndex: "date",
                width: 84,
                render: (value) => (
                  <Typography.Text className="!text-[11px] !text-muted">
                    {formatDate(value, "DD/MM/YY")}
                  </Typography.Text>
                )
              },
              {
                title: "Nominal",
                dataIndex: "amount",
                width: 112,
                align: "right",
                render: (value, item) => (
                  <Typography.Text
                    className={`!text-[11px] !font-medium ${
                      item.entityType === "transaction" && item.raw.type === "expense" ? "!text-expense" : "!text-income"
                    }`}
                  >
                    {formatCurrency(value)}
                  </Typography.Text>
                )
              },
              {
                title: "User",
                dataIndex: "userName",
                width: 90,
                render: (value) => (
                  <Typography.Text className="!text-[11px] !text-ink">
                    {truncateText(value, 10)}
                  </Typography.Text>
                )
              }
            ]}
          />
        </Card>
      ) : null}

      <RecordDetailModal
        record={selectedRecord}
        deletingId={deletingId}
        onClose={() => setSelectedRecord(null)}
        onDelete={handleDelete}
      />
    </div>
  );
}

function RecordDetailModal({ record, deletingId, onClose, onDelete }) {
  const open = Boolean(record);

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
      {record ? (
        <Space orientation="vertical" size={12} className="w-full">
          <div className="min-w-0">
            <Typography.Title level={4} className="!mb-0 !truncate !text-[15px]">
              {record.title}
            </Typography.Title>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Typography.Text className="!text-[12px] !text-muted">
                {record.moduleLabel}
              </Typography.Text>
              <Typography.Text className="!text-[12px] !text-muted">|</Typography.Text>
              <Typography.Text className="!text-[12px] !text-muted">
                {formatDate(record.date)}
              </Typography.Text>
              <Typography.Text className="!text-[12px] !text-muted">|</Typography.Text>
              <Typography.Text className={`!text-[10px] !font-semibold ${getEntityTypeTextClass(record.entityType)}`}>
                {getEntityTypeLabel(record.entityType)}
              </Typography.Text>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <DetailInfo label="Nominal" value={formatCurrency(record.amount || 0)} />
            <DetailInfo label="User" value={record.userName || "-"} />
            <DetailInfo label="Status" value={record.status ? formatStatus(record.status) : "-"} />
            <DetailInfo label="Catatan" value={record.subtitle || "-"} />
          </div>

          <Popconfirm
            title="Hapus record ini?"
            description="Aksi ini tidak bisa dibatalkan."
            okText="Hapus"
            cancelText="Batal"
            okButtonProps={{ danger: true, loading: deletingId === record.id }}
            onConfirm={() => onDelete(record)}
          >
            <Button danger block size="large">
              Hapus record ini
            </Button>
          </Popconfirm>
        </Space>
      ) : null}
    </Modal>
  );
}

function DetailInfo({ label, value }) {
  return (
    <Card size="small" className="finance-soft-card">
      <Typography.Text className="metric-label">{label}</Typography.Text>
      <Typography.Text className="mt-1.5 block text-[12px] font-semibold text-ink">
        {value}
      </Typography.Text>
    </Card>
  );
}

function truncateText(value, maxLength) {
  if (!value) return "-";
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function getMemberName(userId, members) {
  const member = members.find((item) => item.id === userId);
  return member?.fullName || member?.name || member?.email || "-";
}

function getEntityTypeLabel(entityType) {
  switch (entityType) {
    case "saving-goal":
      return "Target";
    case "saving-contribution":
      return "Setoran";
    case "finance-record":
      return "Pokok";
    case "finance-payment":
      return "Bayar";
    default:
      return "Transaksi";
  }
}

function getEntityTypeTextClass(entityType) {
  switch (entityType) {
    case "saving-goal":
      return "text-primary";
    case "saving-contribution":
      return "text-income";
    case "finance-record":
      return "text-warning";
    case "finance-payment":
      return "text-expense";
    default:
      return "text-ink";
  }
}

function formatStatus(status) {
  switch (status) {
    case "active":
      return "Aktif";
    case "completed":
      return "Selesai";
    case "paid":
      return "Lunas";
    case "overdue":
      return "Terlambat";
    case "paused":
      return "Dijeda";
    case "pending":
      return "Menunggu sinkronisasi";
    case "synced":
      return "Tersinkron";
    default:
      return status;
  }
}
