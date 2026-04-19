import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { Alert, Button, Card, DatePicker, Input, InputNumber, Progress, Radio, Select, Space, Tag, Typography } from "antd";
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

      await createFinanceRecord(family.id, {
        familyId: family.id,
        userId: user?.uid || "",
        recordType,
        personName: personName.trim(),
        amountInitial: initialAmount,
        amountRemaining: initialAmount,
        totalPaid: 0,
        paymentCount: 0,
        paymentMethod,
        installmentMonths: totalMonths,
        installmentAmount: Math.ceil(initialAmount / totalMonths),
        startDate: new Date().toISOString().slice(0, 10),
        dueDate,
        status: "active",
        note: ""
      });

      setPersonName("");
      setAmountInitial("");
      setInstallmentMonths("12");
      setDueDate("");
      setRecordAlert({
        type: "success",
        title: "Data hutang atau piutang berhasil disimpan."
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
    <div className="space-y-3">
      <SectionHeading eyebrow="Hutang & Piutang" title="Kelola pokok, cicilan, dan histori pembayaran" />

      <Card className="finance-card finance-soft-card">
        <Space orientation="vertical" size={12} className="w-full">
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
        <Space orientation="vertical" size={12} className="w-full">
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

      {financeRecords.map((record) => {
        const paidPercent = Math.min((Number(record.totalPaid || 0) / Number(record.amountInitial || 1)) * 100, 100);
        const payments = financePayments.filter((item) => item.financeRecordId === record.id);

        return (
          <Card key={record.id} className="finance-card">
            <Space orientation="vertical" size={16} className="w-full">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Typography.Title level={4} className="!mb-0 !text-base">
                    {record.personName}
                  </Typography.Title>
                  <Typography.Text className="mt-1 block !text-sm !text-muted">
                    {record.recordType === "debt" ? "Hutang ke orang" : "Piutang ke orang"} | Jatuh tempo {formatDate(record.dueDate)}
                  </Typography.Text>
                </div>
                <Tag className="rounded-full border-0 bg-white/10 px-3 py-1 text-xs font-semibold text-muted">
                  {record.status === "paid" ? "Lunas" : "Aktif"}
                </Tag>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <InfoCard label="Nominal awal" value={formatCurrency(record.amountInitial)} />
                <InfoCard label="Sisa" value={formatCurrency(record.amountRemaining)} />
                <InfoCard label="Sudah dibayar" value={formatCurrency(record.totalPaid || 0)} />
                <InfoCard label="Progress cicilan" value={`${record.paymentCount || 0} / ${record.installmentMonths || 1} kali`} />
              </div>

              <Progress percent={paidPercent} showInfo={false} strokeColor="#b3394f" railColor="#1b2532" />

              <div>
                <Typography.Text className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Riwayat pembayaran
                </Typography.Text>
                <Space orientation="vertical" size={12} className="mt-3 w-full">
                  {payments.length ? (
                    payments.map((payment) => (
                      <Card key={payment.id} size="small" className="finance-soft-card">
                        <div className="flex items-center justify-between gap-3">
                          <Typography.Text strong className="!text-sm">
                            Pembayaran ke-{payment.paymentNumber || "-"}
                          </Typography.Text>
                          <Typography.Text className="!text-xs !text-muted">{formatDate(payment.paymentDate)}</Typography.Text>
                        </div>
                        <Typography.Text strong className="mt-2 block !text-sm">
                          {formatCurrency(payment.amount)}
                        </Typography.Text>
                        <Typography.Text className="mt-1 block !text-sm !text-muted">
                          {payment.note || "Tanpa catatan"}
                        </Typography.Text>
                      </Card>
                    ))
                  ) : (
                    <Alert type="info" showIcon title="Belum ada pembayaran tercatat." />
                  )}
                </Space>
              </div>
            </Space>
          </Card>
        );
      })}
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <Card size="small" className="finance-soft-card">
      <Typography.Text className="metric-label">{label}</Typography.Text>
      <Typography.Text className="mt-2 block text-sm font-bold text-ink">{value}</Typography.Text>
    </Card>
  );
}
