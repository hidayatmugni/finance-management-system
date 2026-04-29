import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Typography
} from "antd";
import { useFinanceStore } from "../../shared/state/useFinanceStore";
import { SectionHeading } from "../../shared/components/SectionHeading";
import { EmptyState } from "../../shared/components/EmptyState";
import { formatCurrency, formatDate } from "../../shared/utils/format";
import { themePalette } from "../../shared/config/themePalette";
import { createTransaction, deleteTransaction, updateTransaction } from "../../shared/firebase/firestoreTransactions";
import {
  deleteFinancePayment,
  deleteFinanceRecord,
  deleteSavingContribution,
  deleteSavingGoal,
  updateFinancePayment,
  updateFinanceRecord,
  updateSavingContribution,
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

const CASHFLOW_OPTIONS = [
  { value: "all", label: "Semua arus" },
  { value: "income", label: "Masuk" },
  { value: "expense", label: "Keluar" }
];

const SORT_OPTIONS = [
  { value: "date-desc", label: "Tanggal terbaru" },
  { value: "date-asc", label: "Tanggal terlama" },
  { value: "amount-desc", label: "Nominal terbesar" },
  { value: "amount-asc", label: "Nominal terkecil" },
  { value: "title-asc", label: "Nama A-Z" }
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
  const [cashflowFilter, setCashflowFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [submitAlert, setSubmitAlert] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [draft, setDraft] = useState(null);
  const [savingId, setSavingId] = useState("");
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    if (!submitAlert) return undefined;
    const timeoutId = window.setTimeout(() => setSubmitAlert(null), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [submitAlert]);

  useEffect(() => {
    if (!selectedRecord) {
      setDraft(null);
      return;
    }

    setDraft(buildDraft(selectedRecord));
  }, [selectedRecord]);

  const allRecords = useMemo(() => {
    const savingGoalMap = Object.fromEntries(savingsGoals.map((item) => [item.id, item]));
    const financeRecordMap = Object.fromEntries(financeRecords.map((item) => [item.id, item]));

    return [
      ...transactions.map((item) => ({
        id: item.id,
        entityType: "transaction",
        moduleLabel: "Transaksi",
        title: item.title || item.note || item.description || item.categoryName || "Transaksi",
        subtitle: item.note || item.description || item.categoryName || "-",
        amount: Number(item.amount || 0),
        date: item.date || "",
        userId: item.userId || "",
        userName: item.memberName || getMemberName(item.userId, members),
        status: item.syncStatus || "",
        cashflowType: item.type || "expense",
        raw: item,
        searchText: [
          item.title,
          item.note,
          item.description,
          item.categoryName,
          item.memberName,
          item.date
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
      })),
      ...savingsGoals.map((item) => ({
        id: item.id,
        entityType: "saving-goal",
        moduleLabel: "Target tabungan",
        title: item.name,
        subtitle: `Target ${formatCurrency(item.targetAmount || 0)}`,
        amount: Number(item.targetAmount || 0),
        date: item.targetDate || "",
        userId: item.userId || "",
        userName: getMemberName(item.userId, members),
        status: item.status || "",
        cashflowType: "info",
        raw: item,
        searchText: [item.name, item.targetDate].filter(Boolean).join(" ").toLowerCase()
      })),
      ...savingContributions.map((item) => ({
        id: item.id,
        entityType: "saving-contribution",
        moduleLabel: "Setoran tabungan",
        title: savingGoalMap[item.savingGoalId]?.name || "Setoran tabungan",
        subtitle: item.note || "Riwayat setoran",
        amount: Number(item.amount || 0),
        date: item.date || "",
        userId: item.userId || "",
        userName: getMemberName(item.userId, members),
        status: "",
        cashflowType: "expense",
        raw: item,
        searchText: [savingGoalMap[item.savingGoalId]?.name, item.note, item.date]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
      })),
      ...financeRecords.map((item) => ({
        id: item.id,
        entityType: "finance-record",
        moduleLabel: item.recordType === "debt" ? "Hutang" : "Piutang",
        title: item.personName,
        subtitle: `${item.recordType === "debt" ? "Pokok hutang" : "Pokok piutang"} ${getFinanceAssetKindLabel(item.assetKind)} | Sisa ${formatCurrency(item.amountRemaining || 0)}`,
        amount: Number(item.amountInitial || 0),
        date: item.startDate || item.dueDate || "",
        userId: item.userId || "",
        userName: getMemberName(item.userId, members),
        status: item.status || "",
        cashflowType: getFinanceInitialCashflowType(item),
        raw: item,
        searchText: [item.personName, item.note, item.startDate, item.dueDate, getFinanceAssetKindLabel(item.assetKind)]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
      })),
      ...financePayments.map((item) => {
        const financeRecord = financeRecordMap[item.financeRecordId];
        const isDebt = financeRecord?.recordType === "debt";

        return {
          id: item.id,
          entityType: "finance-payment",
          moduleLabel: isDebt ? "Bayar hutang" : "Pelunasan piutang",
          title: financeRecord?.personName || "Pembayaran",
          subtitle: item.note || `Pembayaran ke-${item.paymentNumber || "-"}`,
          amount: Number(item.amount || 0),
          date: item.paymentDate || "",
          userId: item.userId || "",
          userName: getMemberName(item.userId, members),
          status: "",
          cashflowType: isDebt ? "expense" : "income",
          raw: item,
          searchText: [financeRecord?.personName, item.note, item.paymentDate]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
        };
      })
    ];
  }, [financePayments, financeRecords, members, savingContributions, savingsGoals, transactions]);

  const filteredRecords = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const minValue = Number(minAmount || 0);
    const maxValue = maxAmount ? Number(maxAmount) : Number.POSITIVE_INFINITY;

    const records = allRecords.filter((item) => {
      const matchType = recordType === "all" ? true : item.entityType === recordType;
      const matchMember = memberFilter === "all" ? true : item.userId === memberFilter;
      const matchCashflow = cashflowFilter === "all" ? true : item.cashflowType === cashflowFilter;
      const matchQuery = !keyword ? true : item.searchText.includes(keyword);
      const matchStartDate = startDate ? String(item.date || "") >= startDate : true;
      const matchEndDate = endDate ? String(item.date || "") <= endDate : true;
      const matchMinAmount = Number(item.amount || 0) >= minValue;
      const matchMaxAmount = Number(item.amount || 0) <= maxValue;

      return matchType && matchMember && matchCashflow && matchQuery && matchStartDate && matchEndDate && matchMinAmount && matchMaxAmount;
    });

    return [...records].sort((left, right) => {
      switch (sortBy) {
        case "date-asc":
          return String(left.date || "").localeCompare(String(right.date || ""));
        case "amount-desc":
          return Number(right.amount || 0) - Number(left.amount || 0);
        case "amount-asc":
          return Number(left.amount || 0) - Number(right.amount || 0);
        case "title-asc":
          return String(left.title || "").localeCompare(String(right.title || ""));
        default:
          return String(right.date || "").localeCompare(String(left.date || ""));
      }
    });
  }, [allRecords, cashflowFilter, endDate, maxAmount, memberFilter, minAmount, query, recordType, sortBy, startDate]);

  const handleSaveRecord = async () => {
    if (!family?.id || !selectedRecord || !draft) return;

    setSubmitAlert(null);
    setSavingId(selectedRecord.id);

    try {
      if (selectedRecord.entityType === "transaction") {
        const nextTitle = draft.title?.trim() || draft.note?.trim() || selectedRecord.raw.categoryName || "Transaksi";
        const nextNote = draft.note?.trim() || "";
        await updateTransaction({
          familyId: family.id,
          transactionId: selectedRecord.id,
          payload: {
            title: nextTitle,
            note: nextNote,
            description: nextNote,
            amount: Number(draft.amount || 0),
            date: draft.date
          }
        });
      }

      if (selectedRecord.entityType === "saving-goal") {
        await updateSavingGoal(family.id, selectedRecord.id, {
          name: draft.name.trim(),
          targetAmount: Number(draft.targetAmount || 0),
          targetDate: draft.targetDate,
          status: draft.status
        });
      }

      if (selectedRecord.entityType === "saving-contribution") {
        const contribution = selectedRecord.raw;
        const goal = savingsGoals.find((item) => item.id === contribution.savingGoalId);
        if (!goal) {
          throw new Error("Target tabungan asal tidak ditemukan.");
        }

        const previousAmount = Number(contribution.amount || 0);
        const nextAmount = Number(draft.amount || 0);
        const nextCurrentAmount = Math.max(Number(goal.currentAmount || 0) - previousAmount + nextAmount, 0);
        const nextStatus = goal.status === "paused"
          ? "paused"
          : nextCurrentAmount >= Number(goal.targetAmount || 0)
            ? "completed"
            : "active";

        await updateSavingContribution(family.id, contribution.id, {
          amount: nextAmount,
          date: draft.date,
          note: draft.note.trim()
        });

        await updateSavingGoal(family.id, goal.id, {
          currentAmount: nextCurrentAmount,
          status: nextStatus
        });

        const linkedTransaction = findSavingContributionTransaction(transactions, contribution);
        if (linkedTransaction) {
          const nextNote = draft.note.trim() || `Setoran tabungan ${goal.name}`;
          await updateTransaction({
            familyId: family.id,
            transactionId: linkedTransaction.id,
            payload: {
              amount: nextAmount,
              date: draft.date,
              note: nextNote,
              description: nextNote,
              title: `Setoran tabungan ${goal.name}`
            }
          });
        }
      }

      if (selectedRecord.entityType === "finance-record") {
        const financeRecord = selectedRecord.raw;
        const nextAmountInitial = Number(draft.amountInitial || 0);
        const nextTotalPaid = Number(financeRecord.totalPaid || 0);
        const nextRemaining = Math.max(nextAmountInitial - nextTotalPaid, 0);
        const nextStatus = draft.status || (nextRemaining <= 0 ? "paid" : "active");
        const nextAssetKind = normalizeFinanceAssetKind(draft.assetKind);
        const shouldTrackInitialCashflow = nextAssetKind === "money";
        const isDebt = financeRecord.recordType === "debt";
        const nextTitle = isDebt ? `Hutang dari ${draft.personName.trim()}` : `Piutang ke ${draft.personName.trim()}`;
        const nextNote = isDebt ? `Pencairan hutang dari ${draft.personName.trim()}` : `Memberi piutang ke ${draft.personName.trim()}`;

        await updateFinanceRecord(family.id, selectedRecord.id, {
          personName: draft.personName.trim(),
          assetKind: nextAssetKind,
          amountInitial: nextAmountInitial,
          amountRemaining: nextRemaining,
          installmentAmount: Math.ceil(nextAmountInitial / Number(financeRecord.installmentMonths || 1)),
          startDate: draft.startDate,
          dueDate: draft.dueDate,
          status: nextStatus
        });

        const linkedTransaction = findFinanceInitialTransaction(transactions, financeRecord.id);
        if (linkedTransaction && shouldTrackInitialCashflow) {
          await updateTransaction({
            familyId: family.id,
            transactionId: linkedTransaction.id,
            payload: {
              type: isDebt ? "income" : "expense",
              categoryId: isDebt ? "lainnya_income" : "lainnya_expense",
              amount: nextAmountInitial,
              date: draft.startDate,
              title: nextTitle,
              note: nextNote,
              description: nextNote
            }
          });
        }

        if (linkedTransaction && !shouldTrackInitialCashflow) {
          await deleteTransaction({ familyId: family.id, transactionId: linkedTransaction.id });
        }

        if (!linkedTransaction && shouldTrackInitialCashflow) {
          await createTransaction({
            familyId: family.id,
            payload: {
              familyId: family.id,
              userId: financeRecord.userId || "",
              createdBy: financeRecord.userId || "",
              ownershipType: "shared",
              type: isDebt ? "income" : "expense",
              categoryId: isDebt ? "lainnya_income" : "lainnya_expense",
              accountId: null,
              amount: nextAmountInitial,
              date: draft.startDate,
              note: nextNote,
              tags: [isDebt ? "hutang_awal" : "piutang_awal"],
              syncStatus: "synced",
              title: nextTitle,
              memberName: selectedRecord.userName || getMemberName(financeRecord.userId, members),
              categoryName: "Lainnya",
              sourceModule: "finance-record",
              relatedFinanceRecordId: financeRecord.id
            }
          });
        }
      }

      if (selectedRecord.entityType === "finance-payment") {
        const payment = selectedRecord.raw;
        const financeRecord = financeRecords.find((item) => item.id === payment.financeRecordId);
        if (!financeRecord) {
          throw new Error("Data hutang/piutang asal tidak ditemukan.");
        }

        const previousAmount = Number(payment.amount || 0);
        const nextAmount = Number(draft.amount || 0);
        const nextTotalPaid = Math.max(Number(financeRecord.totalPaid || 0) - previousAmount + nextAmount, 0);
        const nextRemaining = Math.max(Number(financeRecord.amountInitial || 0) - nextTotalPaid, 0);
        const nextStatus = nextRemaining <= 0 ? "paid" : "active";

        await updateFinancePayment(family.id, payment.id, {
          amount: nextAmount,
          paymentDate: draft.paymentDate,
          note: draft.note.trim()
        });

        await updateFinanceRecord(family.id, financeRecord.id, {
          totalPaid: nextTotalPaid,
          amountRemaining: nextRemaining,
          status: nextStatus
        });

        const linkedTransaction = findFinancePaymentTransaction(transactions, payment);
        if (linkedTransaction) {
          const isDebt = financeRecord.recordType === "debt";
          const nextNote = draft.note.trim() || (isDebt ? `Bayar hutang ke ${financeRecord.personName}` : `Pelunasan piutang dari ${financeRecord.personName}`);
          const nextTitle = isDebt ? `Bayar hutang ${financeRecord.personName}` : `Pelunasan piutang ${financeRecord.personName}`;

          await updateTransaction({
            familyId: family.id,
            transactionId: linkedTransaction.id,
            payload: {
              amount: nextAmount,
              date: draft.paymentDate,
              title: nextTitle,
              note: nextNote,
              description: nextNote
            }
          });
        }
      }

      setSubmitAlert({
        type: "success",
        title: "Perubahan record berhasil disimpan."
      });
      setSelectedRecord(null);
    } catch (error) {
      setSubmitAlert({
        type: "error",
        title: error instanceof Error ? error.message : "Gagal menyimpan perubahan record."
      });
    } finally {
      setSavingId("");
    }
  };

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

        const linkedTransaction = findSavingContributionTransaction(transactions, contribution);
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

        const initialTransaction = findFinanceInitialTransaction(transactions, record.id);
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

        const linkedTransaction = findFinancePaymentTransaction(transactions, payment);
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
      <SectionHeading eyebrow="Admin Data" title="Kelola, edit, dan hapus record dari satu meja admin" />

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
            placeholder="Cari catatan transaksi, nama tabungan, nama hutang/piutang, atau deskripsi pembayaran"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          <div className="grid grid-cols-2 gap-2">
            <Select size="large" value={recordType} onChange={setRecordType} options={RECORD_TYPE_OPTIONS} />
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

          <div className="grid grid-cols-2 gap-2">
            <Select size="large" value={cashflowFilter} onChange={setCashflowFilter} options={CASHFLOW_OPTIONS} />
            <Select size="large" value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <DatePicker
              value={startDate ? dayjs(startDate) : null}
              onChange={(value) => setStartDate(value ? value.format("YYYY-MM-DD") : "")}
              size="large"
              className="!w-full"
              placeholder="Tanggal awal"
              format="DD MMM YYYY"
            />
            <DatePicker
              value={endDate ? dayjs(endDate) : null}
              onChange={(value) => setEndDate(value ? value.format("YYYY-MM-DD") : "")}
              size="large"
              className="!w-full"
              placeholder="Tanggal akhir"
              format="DD MMM YYYY"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <InputNumber
              value={minAmount || null}
              onChange={(value) => setMinAmount(String(value || ""))}
              size="large"
              className="!w-full"
              min={0}
              controls={false}
              placeholder="Nominal minimum"
            />
            <InputNumber
              value={maxAmount || null}
              onChange={(value) => setMaxAmount(String(value || ""))}
              size="large"
              className="!w-full"
              min={0}
              controls={false}
              placeholder="Nominal maksimum"
            />
          </div>

          <Typography.Text className="!text-[12px] !text-muted">
            Menampilkan {filteredRecords.length} record. Pakai tombol kelola untuk edit detail atau hapus kalau memang salah input.
          </Typography.Text>
        </Space>
      </Card>

      {!filteredRecords.length ? (
        <EmptyState
          title="Tidak ada record yang cocok"
          description="Coba ubah kata kunci, tanggal, nominal, atau arus kas agar data yang dicari muncul."
        />
      ) : null}

      {filteredRecords.length ? (
        <Card className="finance-card" styles={{ body: { padding: 0, overflow: "hidden" } }}>
          <Table
            size="small"
            rowKey={(record) => `${record.entityType}-${record.id}`}
            scroll={{ x: 860 }}
            pagination={{
              pageSize: 12,
              size: "small",
              showSizeChanger: false
            }}
            dataSource={filteredRecords}
            columns={[
              {
                title: "Record",
                dataIndex: "title",
                width: 170,
                render: (_, item) => (
                  <div className="min-w-0 py-0.5">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <Typography.Text className={`!text-[10px] !font-semibold uppercase tracking-[0.12em] ${getEntityTypeTextClass(item.entityType)}`}>
                        {getEntityTypeLabel(item.entityType)}
                      </Typography.Text>
                      <Typography.Text className="!text-[10px] !text-muted">
                        {getCashflowLabel(item.cashflowType)}
                      </Typography.Text>
                    </div>
                    <Typography.Text strong className="mt-1 !block !truncate !text-[12px] !font-semibold">
                      {item.title}
                    </Typography.Text>
                    <Typography.Text className="mt-0.5 !block !truncate !text-[11px] !text-muted">
                      {item.subtitle}
                    </Typography.Text>
                  </div>
                )
              },
              {
                title: "Tgl",
                dataIndex: "date",
                width: 60,
                render: (value) => (
                  <Typography.Text className="!whitespace-nowrap !text-[11px] !text-muted">
                    {formatDate(value, "DD/MM/YY")}
                  </Typography.Text>
                )
              },
              {
                title: "Nominal",
                dataIndex: "amount",
                width: 80,
                align: "right",
                render: (value, item) => (
                  <Typography.Text className={`!whitespace-nowrap !text-[11px] !font-semibold ${getAmountTextClass(item.cashflowType)}`}>
                    {formatCurrency(value)}
                  </Typography.Text>
                )
              },
              {
                title: "User",
                dataIndex: "userName",
                width: 40,
                render: (value) => (
                  <Typography.Text className="!whitespace-nowrap !text-[11px] !text-ink">
                    {truncateText(value, 14)}
                  </Typography.Text>
                )
              },
              {
                title: "Aksi",
                key: "actions",
                width: 100,
                align: "right",
                render: (_, item) => (
                  <Space size={6} wrap={false} className="!whitespace-nowrap">
                    <Button size="small" onClick={() => setSelectedRecord(item)}>
                      Kelola
                    </Button>
                    <Popconfirm
                      title="Hapus record ini?"
                      description="Aksi ini tidak bisa dibatalkan."
                      okText="Hapus"
                      cancelText="Batal"
                      okButtonProps={{ danger: true, loading: deletingId === item.id }}
                      onConfirm={() => handleDelete(item)}
                    >
                      <Button size="small" danger>
                        Hapus
                      </Button>
                    </Popconfirm>
                  </Space>
                )
              }
            ]}
          />
        </Card>
      ) : null}

      <RecordManageModal
        record={selectedRecord}
        draft={draft}
        savingId={savingId}
        deletingId={deletingId}
        onChangeDraft={setDraft}
        onClose={() => setSelectedRecord(null)}
        onDelete={handleDelete}
        onSave={handleSaveRecord}
      />
    </div>
  );
}

function RecordManageModal({ record, draft, savingId, deletingId, onChangeDraft, onClose, onDelete, onSave }) {
  const open = Boolean(record);

  const setField = (key, value) => {
    onChangeDraft((current) => ({ ...current, [key]: value }));
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={null}
      centered
      width={460}
      styles={{ content: { background: themePalette.colors.panel, padding: 16 }, body: { padding: 0 } }}
    >
      {record && draft ? (
        <Space orientation="vertical" size={12} className="w-full">
          <div className="min-w-0">
            <Typography.Title level={4} className="!mb-0 !truncate !text-[15px]">
              {record.title}
            </Typography.Title>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Typography.Text className={`!text-[10px] !font-semibold uppercase tracking-[0.12em] ${getEntityTypeTextClass(record.entityType)}`}>
                {getEntityTypeLabel(record.entityType)}
              </Typography.Text>
              <Typography.Text className="!text-[12px] !text-muted">|</Typography.Text>
              <Typography.Text className="!text-[12px] !text-muted">
                {formatDate(record.date)}
              </Typography.Text>
              <Typography.Text className="!text-[12px] !text-muted">|</Typography.Text>
              <Typography.Text className="!text-[12px] !text-muted">
                {record.userName || "-"}
              </Typography.Text>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {record.entityType === "transaction" ? (
              <>
                <Input
                  value={draft.title}
                  onChange={(event) => setField("title", event.target.value)}
                  placeholder="Judul transaksi"
                />
                <InputNumber
                  value={draft.amount || null}
                  onChange={(value) => setField("amount", String(value || ""))}
                  className="!w-full"
                  min={0}
                  controls={false}
                  placeholder="Nominal"
                />
                <DatePicker
                  value={draft.date ? dayjs(draft.date) : null}
                  onChange={(value) => setField("date", value ? value.format("YYYY-MM-DD") : "")}
                  className="!w-full"
                  format="DD MMM YYYY"
                />
                <Input value={draft.note} onChange={(event) => setField("note", event.target.value)} placeholder="Keterangan" />
              </>
            ) : null}

            {record.entityType === "saving-goal" ? (
              <>
                <Input
                  value={draft.name}
                  onChange={(event) => setField("name", event.target.value)}
                  placeholder="Nama target"
                />
                <InputNumber
                  value={draft.targetAmount || null}
                  onChange={(value) => setField("targetAmount", String(value || ""))}
                  className="!w-full"
                  min={0}
                  controls={false}
                  placeholder="Nominal target"
                />
                <DatePicker
                  value={draft.targetDate ? dayjs(draft.targetDate) : null}
                  onChange={(value) => setField("targetDate", value ? value.format("YYYY-MM-DD") : "")}
                  className="!w-full"
                  format="DD MMM YYYY"
                />
                <Select
                  value={draft.status}
                  onChange={(value) => setField("status", value)}
                  options={[
                    { value: "active", label: "Aktif" },
                    { value: "paused", label: "Dijeda" },
                    { value: "completed", label: "Selesai" }
                  ]}
                />
              </>
            ) : null}

            {record.entityType === "saving-contribution" ? (
              <>
                <Input value={record.title} disabled />
                <InputNumber
                  value={draft.amount || null}
                  onChange={(value) => setField("amount", String(value || ""))}
                  className="!w-full"
                  min={0}
                  controls={false}
                  placeholder="Nominal setoran"
                />
                <DatePicker
                  value={draft.date ? dayjs(draft.date) : null}
                  onChange={(value) => setField("date", value ? value.format("YYYY-MM-DD") : "")}
                  className="!w-full"
                  format="DD MMM YYYY"
                />
                <Input value={draft.note} onChange={(event) => setField("note", event.target.value)} placeholder="Catatan setoran" />
              </>
            ) : null}

            {record.entityType === "finance-record" ? (
              <>
                <Input
                  value={draft.personName}
                  onChange={(event) => setField("personName", event.target.value)}
                  placeholder="Nama pihak"
                />
                <InputNumber
                  value={draft.amountInitial || null}
                  onChange={(value) => setField("amountInitial", String(value || ""))}
                  className="!w-full"
                  min={0}
                  controls={false}
                  placeholder="Nominal awal"
                />
                <DatePicker
                  value={draft.startDate ? dayjs(draft.startDate) : null}
                  onChange={(value) => setField("startDate", value ? value.format("YYYY-MM-DD") : "")}
                  className="!w-full"
                  format="DD MMM YYYY"
                />
                <DatePicker
                  value={draft.dueDate ? dayjs(draft.dueDate) : null}
                  onChange={(value) => setField("dueDate", value ? value.format("YYYY-MM-DD") : "")}
                  className="!w-full"
                  format="DD MMM YYYY"
                />
                <Select
                  value={draft.status}
                  onChange={(value) => setField("status", value)}
                  options={[
                    { value: "active", label: "Aktif" },
                    { value: "overdue", label: "Terlambat" },
                    { value: "paid", label: "Lunas" }
                  ]}
                />
                <Select
                  value={draft.assetKind}
                  onChange={(value) => setField("assetKind", value)}
                  options={[
                    { value: "goods", label: "Barang / kredit barang" },
                    { value: "money", label: "Uang / tunai" }
                  ]}
                />
                <Input value={record.raw.recordType === "debt" ? "Hutang" : "Piutang"} disabled />
              </>
            ) : null}

            {record.entityType === "finance-payment" ? (
              <>
                <Input value={record.title} disabled />
                <InputNumber
                  value={draft.amount || null}
                  onChange={(value) => setField("amount", String(value || ""))}
                  className="!w-full"
                  min={0}
                  controls={false}
                  placeholder="Nominal pembayaran"
                />
                <DatePicker
                  value={draft.paymentDate ? dayjs(draft.paymentDate) : null}
                  onChange={(value) => setField("paymentDate", value ? value.format("YYYY-MM-DD") : "")}
                  className="!w-full"
                  format="DD MMM YYYY"
                />
                <Input value={draft.note} onChange={(event) => setField("note", event.target.value)} placeholder="Catatan pembayaran" />
              </>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <DetailInfo label="Jenis data" value={record.moduleLabel} />
            <DetailInfo label="Arus kas" value={getCashflowLabel(record.cashflowType)} />
            <DetailInfo label="User" value={record.userName || "-"} />
            <DetailInfo label="Status" value={record.status ? formatStatus(record.status) : "-"} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button type="primary" size="large" loading={savingId === record.id} onClick={onSave}>
              Simpan perubahan
            </Button>
            <Popconfirm
              title="Hapus record ini?"
              description="Aksi ini tidak bisa dibatalkan."
              okText="Hapus"
              cancelText="Batal"
              okButtonProps={{ danger: true, loading: deletingId === record.id }}
              onConfirm={() => onDelete(record)}
            >
              <Button danger size="large">
                Hapus record
              </Button>
            </Popconfirm>
          </div>
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

function buildDraft(record) {
  switch (record.entityType) {
    case "transaction":
      return {
        title: record.raw.title || "",
        amount: String(record.raw.amount || ""),
        date: record.raw.date || "",
        note: record.raw.note || record.raw.description || ""
      };
    case "saving-goal":
      return {
        name: record.raw.name || "",
        targetAmount: String(record.raw.targetAmount || ""),
        targetDate: record.raw.targetDate || "",
        status: record.raw.status || "active"
      };
    case "saving-contribution":
      return {
        amount: String(record.raw.amount || ""),
        date: record.raw.date || "",
        note: record.raw.note || ""
      };
    case "finance-record":
      return {
        personName: record.raw.personName || "",
        assetKind: normalizeFinanceAssetKind(record.raw.assetKind),
        amountInitial: String(record.raw.amountInitial || ""),
        startDate: record.raw.startDate || "",
        dueDate: record.raw.dueDate || "",
        status: record.raw.status || "active"
      };
    case "finance-payment":
      return {
        amount: String(record.raw.amount || ""),
        paymentDate: record.raw.paymentDate || "",
        note: record.raw.note || ""
      };
    default:
      return null;
  }
}

function findSavingContributionTransaction(transactions, contribution) {
  return transactions.find(
    (item) =>
      item.sourceModule === "savings" &&
      item.relatedSavingGoalId === contribution.savingGoalId &&
      Number(item.amount || 0) === Number(contribution.amount || 0) &&
      item.date === contribution.date
  );
}

function findFinanceInitialTransaction(transactions, financeRecordId) {
  return transactions.find(
    (item) =>
      item.relatedFinanceRecordId === financeRecordId &&
      item.sourceModule === "finance-record" &&
      Array.isArray(item.tags) &&
      item.tags.some((tag) => tag === "hutang_awal" || tag === "piutang_awal")
  );
}

function findFinancePaymentTransaction(transactions, payment) {
  return transactions.find(
    (item) =>
      item.relatedFinanceRecordId === payment.financeRecordId &&
      item.sourceModule === "finance-record" &&
      Number(item.amount || 0) === Number(payment.amount || 0) &&
      item.date === payment.paymentDate &&
      Array.isArray(item.tags) &&
      item.tags.some((tag) => tag === "pembayaran_hutang" || tag === "pelunasan_piutang")
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

function normalizeFinanceAssetKind(assetKind) {
  return assetKind === "goods" ? "goods" : "money";
}

function getFinanceAssetKindLabel(assetKind) {
  return normalizeFinanceAssetKind(assetKind) === "goods" ? "Barang" : "Uang";
}

function getFinanceInitialCashflowType(record) {
  if (normalizeFinanceAssetKind(record.assetKind) === "goods") {
    return "info";
  }

  return record.recordType === "debt" ? "income" : "expense";
}

function getCashflowLabel(cashflowType) {
  switch (cashflowType) {
    case "income":
      return "Masuk";
    case "expense":
      return "Keluar";
    default:
      return "Info";
  }
}

function getAmountTextClass(cashflowType) {
  switch (cashflowType) {
    case "income":
      return "!text-income";
    case "expense":
      return "!text-expense";
    default:
      return "!text-ink";
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
