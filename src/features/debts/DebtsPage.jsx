import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, DatePicker, Input, InputNumber, Modal, Progress, Radio, Select, Space, Table, Tag, Typography } from "antd";
import { EmptyState } from "../../shared/components/EmptyState";
import { SectionHeading } from "../../shared/components/SectionHeading";
import { formatCurrency, formatDate } from "../../shared/utils/format";
import {
  createFinancePayment,
  createFinanceRecord,
  updateFinanceRecord
} from "../../shared/firebase/firestoreHousehold.js";
import { useAuth } from "../auth/AuthProvider";
import { useFinanceStore } from "../../shared/state/useFinanceStore";
import { createTransaction } from "../../shared/firebase/firestoreTransactions";

export function DebtsPage() {
  const family = useFinanceStore((state) => state.family);
  const financeRecords = useFinanceStore((state) => state.financeRecords);
  const financePayments = useFinanceStore((state) => state.financePayments);
  const members = useFinanceStore((state) => state.members);
  const { user } = useAuth();
  const [recordType, setRecordType] = useState("debt");
  const [personName, setPersonName] = useState("");
  const [amountInitial, setAmountInitial] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("installment");
  const [installmentMonths, setInstallmentMonths] = useState("12");
  const [dueDate, setDueDate] = useState("");
  const [activeRecordId, setActiveRecordId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentNote, setPaymentNote] = useState("");
  const [recordAlert, setRecordAlert] = useState(null);
  const [paymentAlert, setPaymentAlert] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    if (!recordAlert) return undefined;
    const timeoutId = window.setTimeout(() => setRecordAlert(null), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [recordAlert]);

  useEffect(() => {
    if (!paymentAlert) return undefined;
    const timeoutId = window.setTimeout(() => setPaymentAlert(null), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [paymentAlert]);

  const memberName = useMemo(() => {
    const member = members.find((item) => item.id === user?.uid);
    return member?.fullName || member?.name || user?.displayName || user?.email || "Tanpa nama";
  }, [members, user?.displayName, user?.email, user?.uid]);

  const handleCreateRecord = async () => {
    setRecordAlert(null);
    if (!family?.id || !personName.trim() || !amountInitial || !dueDate) {
      setRecordAlert({
        type: "warning",
        title: "Lengkapi nama, nominal, dan tanggal jatuh tempo terlebih dahulu."
      });
      return;
    }

    try {
      const totalMonths = paymentMethod === "single" ? 1 : Number(installmentMonths || 1);
      const initialAmount = Number(amountInitial);
      const startDate = new Date().toISOString().slice(0, 10);
      const cleanPersonName = personName.trim();
      const isDebt = recordType === "debt";

      const recordRef = await createFinanceRecord(family.id, {
        familyId: family.id,
        userId: user?.uid || "",
        recordType,
        personName: cleanPersonName,
        amountInitial: initialAmount,
        amountRemaining: initialAmount,
        totalPaid: 0,
        paymentCount: 0,
        paymentMethod,
        installmentMonths: totalMonths,
        installmentAmount: Math.ceil(initialAmount / totalMonths),
        startDate,
        dueDate,
        status: "active",
        note: ""
      });

      await createTransaction({
        familyId: family.id,
        payload: {
          familyId: family.id,
          userId: user?.uid || "",
          createdBy: user?.uid || "",
          ownershipType: "shared",
          type: isDebt ? "income" : "expense",
          categoryId: isDebt ? "lainnya_income" : "lainnya_expense",
          accountId: null,
          amount: initialAmount,
          date: startDate,
          note: isDebt ? `Pencairan hutang dari ${cleanPersonName}` : `Memberi piutang ke ${cleanPersonName}`,
          tags: [isDebt ? "hutang_awal" : "piutang_awal"],
          syncStatus: "synced",
          title: isDebt ? `Hutang dari ${cleanPersonName}` : `Piutang ke ${cleanPersonName}`,
          memberName,
          categoryName: "Lainnya",
          sourceModule: "finance-record",
          relatedFinanceRecordId: recordRef.id
        }
      });

      setPersonName("");
      setAmountInitial("");
      setInstallmentMonths("12");
      setDueDate("");
      setRecordAlert({
        type: "success",
        title: "Data hutang atau piutang berhasil disimpan dan arus kas awal ikut tercatat."
      });
    } catch (error) {
      setRecordAlert({
        type: "error",
        title: error instanceof Error ? error.message : "Gagal menyimpan data hutang atau piutang."
      });
    }
  };

  const handleCreatePayment = async () => {
    const record = financeRecords.find((item) => item.id === activeRecordId);
    setPaymentAlert(null);
    if (!family?.id || !record || !paymentAmount || !paymentDate) {
      setPaymentAlert({
        type: "warning",
        title: "Pilih data hutang/piutang, isi nominal bayar, dan tanggal pembayaran."
      });
      return;
    }

    try {
      const amount = Number(paymentAmount);
      const nextTotalPaid = Number(record.totalPaid || 0) + amount;
      const nextRemaining = Math.max(Number(record.amountInitial || 0) - nextTotalPaid, 0);
      const nextPaymentCount = Number(record.paymentCount || 0) + 1;
      const nextStatus = nextRemaining <= 0 ? "paid" : "active";
      const isDebt = record.recordType === "debt";

      await createFinancePayment(family.id, {
        familyId: family.id,
        financeRecordId: record.id,
        userId: user?.uid || "",
        amount,
        paymentDate,
        note: paymentNote.trim(),
        paymentNumber: nextPaymentCount
      });

      await updateFinanceRecord(family.id, record.id, {
        amountRemaining: nextRemaining,
        totalPaid: nextTotalPaid,
        paymentCount: nextPaymentCount,
        status: nextStatus
      });

      await createTransaction({
        familyId: family.id,
        payload: {
          familyId: family.id,
          userId: user?.uid || "",
          createdBy: user?.uid || "",
          ownershipType: "shared",
          type: isDebt ? "expense" : "income",
          categoryId: isDebt ? "tagihan" : "lainnya_income",
          accountId: null,
          amount,
          date: paymentDate,
          note: paymentNote.trim() || (isDebt ? `Bayar hutang ke ${record.personName}` : `Pelunasan piutang dari ${record.personName}`),
          tags: [record.recordType === "debt" ? "pembayaran_hutang" : "pelunasan_piutang"],
          syncStatus: "synced",
          title: isDebt ? `Bayar hutang ${record.personName}` : `Pelunasan piutang ${record.personName}`,
          memberName,
          categoryName: isDebt ? "Tagihan" : "Lainnya",
          sourceModule: "finance-record",
          relatedFinanceRecordId: record.id
        }
      });

      setPaymentAmount("");
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setPaymentNote("");
      setActiveRecordId("");
      setPaymentAlert({
        type: "success",
        title: "Pembayaran berhasil disimpan dan arus kas ikut diperbarui."
      });
    } catch (error) {
      setPaymentAlert({
        type: "error",
        title: error instanceof Error ? error.message : "Gagal menyimpan pembayaran."
      });
    }
  };

  return (
    <div className="space-y-2.5">
      <SectionHeading eyebrow="Hutang & Piutang" title="Kelola pokok, cicilan, dan histori pembayaran" />

      <Card className="finance-card finance-soft-card">
        <Space orientation="vertical" size={10} className="w-full">
          <Typography.Title level={4} className="!m-0 !text-sm !font-bold">
            Buat hutang atau piutang baru
          </Typography.Title>
          {recordAlert ? (
            <Alert
              type={recordAlert.type}
              showIcon
              title={recordAlert.title}
              closable={{ closeIcon: true, onClose: () => setRecordAlert(null), "aria-label": "close" }}
            />
          ) : null}
          <Radio.Group
            value={recordType}
            onChange={(event) => setRecordType(event.target.value)}
            optionType="button"
            buttonStyle="solid"
            className="finance-type-toggle"
            options={[
              { value: "debt", label: "Hutang ke orang" },
              { value: "receivable", label: "Piutang ke orang" }
            ]}
          />
          <Input
            value={personName}
            onChange={(event) => setPersonName(event.target.value)}
            size="large"
            placeholder={recordType === "debt" ? "Nama pemberi hutang" : "Nama orang yang berhutang"}
          />
          <div className="grid grid-cols-2 gap-2">
            <InputNumber
              value={amountInitial || null}
              onChange={(value) => setAmountInitial(String(value || ""))}
              size="large"
              className="!w-full"
              min={0}
              controls={false}
              placeholder="Nominal awal"
            />
            <DatePicker
              value={dueDate ? dayjs(dueDate) : null}
              onChange={(value) => setDueDate(value ? value.format("YYYY-MM-DD") : "")}
              size="large"
              className="!w-full"
              format="DD MMM YYYY"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={paymentMethod}
              onChange={setPaymentMethod}
              size="large"
              options={[
                { value: "installment", label: "Cicilan" },
                { value: "single", label: "Sekali bayar" }
              ]}
            />
            <InputNumber
              value={installmentMonths || null}
              onChange={(value) => setInstallmentMonths(String(value || ""))}
              size="large"
              className="!w-full"
              min={1}
              controls={false}
              placeholder="Tenor bulan"
              disabled={paymentMethod === "single"}
            />
          </div>
          <Button type="primary" size="large" onClick={handleCreateRecord} block>
            Simpan hutang / piutang
          </Button>
        </Space>
      </Card>

      <Card className="finance-card finance-soft-card">
        <Space orientation="vertical" size={10} className="w-full">
          <Typography.Title level={4} className="!m-0 !text-sm !font-bold">
            Input pembayaran
          </Typography.Title>
          {paymentAlert ? (
            <Alert
              type={paymentAlert.type}
              showIcon
              title={paymentAlert.title}
              closable={{ closeIcon: true, onClose: () => setPaymentAlert(null), "aria-label": "close" }}
            />
          ) : null}
          <Select
            value={activeRecordId || undefined}
            onChange={setActiveRecordId}
            size="large"
            placeholder="Pilih data hutang / piutang"
            options={financeRecords
              .filter((item) => item.status !== "paid")
              .map((record) => ({
                value: record.id,
                label: `${record.recordType === "debt" ? "Hutang" : "Piutang"} - ${record.personName}`
              }))}
          />
          <div className="grid grid-cols-2 gap-2">
            <InputNumber
              value={paymentAmount || null}
              onChange={(value) => setPaymentAmount(String(value || ""))}
              size="large"
              className="!w-full"
              min={0}
              controls={false}
              placeholder="Nominal bayar"
            />
            <DatePicker
              value={paymentDate ? dayjs(paymentDate) : null}
              onChange={(value) => setPaymentDate(value ? value.format("YYYY-MM-DD") : "")}
              size="large"
              className="!w-full"
              format="DD MMM YYYY"
            />
          </div>
          <Input.TextArea
            value={paymentNote}
            onChange={(event) => setPaymentNote(event.target.value)}
            autoSize={{ minRows: 3, maxRows: 5 }}
            placeholder="Contoh: Cicilan bulan ke-3"
          />
          <Button type="primary" size="large" onClick={handleCreatePayment} block>
            Simpan pembayaran
          </Button>
        </Space>
      </Card>

      {!financeRecords.length ? (
        <EmptyState
          title="Belum ada hutang atau piutang"
          description="Buat data hutang atau piutang dulu agar cicilan dan pelunasannya bisa dilacak."
        />
      ) : null}

      {financeRecords.length ? (
        <Card className="finance-card" styles={{ body: { padding: 0, overflow: "hidden" } }}>
          <Table
            size="small"
            tableLayout="fixed"
            rowKey="id"
            pagination={false}
            dataSource={financeRecords}
            scroll={{ x: 520, y: 430 }}
            onRow={(record) => ({
              onClick: () => setSelectedRecord(record)
            })}
            columns={[
              {
                title: "Tipe",
                dataIndex: "recordType",
                width: 88,
                render: (value) => (
                  <Tag className={`rounded-full border-0 px-2.5 py-0.5 text-[11px] font-semibold ${getFinanceTypeTagClass(value)}`}>
                    {value === "debt" ? "Hutang" : "Piutang"}
                  </Tag>
                )
              },
              {
                title: "Tgl",
                dataIndex: "startDate",
                width: 74,
                render: (value) => (
                  <Typography.Text className="!text-[11px] !text-muted">
                    {formatDate(value, "DD/MM/YY")}
                  </Typography.Text>
                )
              },
              {
                title: "Nama",
                dataIndex: "personName",
                width: 120,
                render: (value, item) => (
                  <div>
                    <Typography.Text strong className="!block !truncate !text-[13px] !font-semibold">
                      {truncateText(value, 14)}
                    </Typography.Text>
                    <Typography.Text className={`!block !truncate !text-[11px] !font-medium ${getFinanceStatusTextClass(item.status)}`}>
                      {getFinanceStatusLabel(item.status)}
                    </Typography.Text>
                  </div>
                )
              },
              {
                title: "Total",
                dataIndex: "amountInitial",
                width: 108,
                align: "right",
                render: (value) => (
                  <Typography.Text className="!whitespace-nowrap !text-[11px] !font-medium !text-muted">
                    {formatCurrency(value)}
                  </Typography.Text>
                )
              },
              {
                title: "Sisa",
                dataIndex: "amountRemaining",
                width: 108,
                align: "right",
                render: (value) => (
                  <Typography.Text className="!whitespace-nowrap !text-[11px] !font-semibold !text-expense">
                    {formatCurrency(value)}
                  </Typography.Text>
                )
              }
            ]}
          />
        </Card>
      ) : null}

      <FinanceDetailModal
        record={selectedRecord}
        payments={financePayments.filter((item) => item.financeRecordId === selectedRecord?.id)}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
}

function FinanceDetailModal({ record, payments, onClose }) {
  const open = Boolean(record);
  const paidPercent = record
    ? Math.min((Number(record.totalPaid || 0) / Number(record.amountInitial || 1)) * 100, 100)
    : 0;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={null}
      centered
      width={420}
      styles={{ content: { background: "#171717", padding: 16 }, body: { padding: 0 } }}
    >
      {record ? (
        <Space orientation="vertical" size={12} className="w-full">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Typography.Title level={4} className="!mb-0 !text-[15px]">
                {record.personName}
              </Typography.Title>
              <Typography.Text className="mt-1 block !text-[12px] !text-muted">
                {record.recordType === "debt" ? "Hutang ke orang" : "Piutang ke orang"} | Jatuh tempo {formatDate(record.dueDate)}
              </Typography.Text>
            </div>
            <Tag className={`rounded-full border-0 px-3 py-1 text-xs font-semibold ${getFinanceStatusTagClass(record.status)}`}>
              {getFinanceStatusLabel(record.status)}
            </Tag>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <DetailInfo label="Sisa" value={formatCurrency(record.amountRemaining)} />
            <DetailInfo label="Sudah dibayar" value={formatCurrency(record.totalPaid || 0)} />
            <DetailInfo label="Progress cicilan" value={`${record.paymentCount || 0} / ${record.installmentMonths || 1} kali`} />
            <DetailInfo label="Nominal awal" value={formatCurrency(record.amountInitial)} />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <Typography.Text className="text-[11px] font-medium text-muted">
                Terbayar {formatCurrency(record.totalPaid || 0)} dari {formatCurrency(record.amountInitial || 0)}
              </Typography.Text>
            </div>
            <Progress percent={Math.round(paidPercent)} strokeColor="#148a54" railColor="#242426" />
          </div>

          <div>
            <Typography.Text className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Riwayat pembayaran
            </Typography.Text>
            <div className="mt-2.5 max-h-[248px] overflow-y-auto rounded-[12px] border border-line">
              {payments.length ? (
                payments.map((payment, index) => (
                  <div
                    key={payment.id}
                    className={`bg-[#171717] px-3 py-2 ${index === payments.length - 1 ? "" : "border-b border-line"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Typography.Text strong className="!text-[13px] !font-semibold">
                        Pembayaran ke-{payment.paymentNumber || "-"}
                      </Typography.Text>
                      <Typography.Text className="!text-[11px] !text-muted">
                        {formatDate(payment.paymentDate)}
                      </Typography.Text>
                    </div>
                    <Typography.Text strong className="mt-0.5 block !text-[13px]">
                      {formatCurrency(payment.amount)}
                    </Typography.Text>
                    <Typography.Text className="mt-0.5 block !text-[12px] !text-muted">
                      {payment.note || "Tanpa catatan"}
                    </Typography.Text>
                  </div>
                ))
              ) : (
                <Alert type="info" showIcon title="Belum ada pembayaran tercatat." />
              )}
            </div>
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
      <Typography.Text className="mt-1.5 block text-[13px] font-semibold text-ink">{value}</Typography.Text>
    </Card>
  );
}

function truncateText(value, maxLength) {
  if (!value) return "-";
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function getFinanceStatusLabel(status) {
  switch (status) {
    case "paid":
      return "Lunas";
    case "overdue":
      return "Terlambat";
    default:
      return "Aktif";
  }
}

function getFinanceStatusTagClass(status) {
  switch (status) {
    case "paid":
      return "bg-income/15 text-income";
    case "overdue":
      return "bg-warning/15 text-warning";
    default:
      return "bg-primary/15 text-primary";
  }
}

function getFinanceStatusTextClass(status) {
  switch (status) {
    case "paid":
      return "!text-income";
    case "overdue":
      return "!text-warning";
    default:
      return "!text-primary";
  }
}

function getFinanceTypeTagClass(recordType) {
  switch (recordType) {
    case "debt":
      return "bg-expense/15 text-expense";
    default:
      return "bg-income/15 text-income";
  }
}
