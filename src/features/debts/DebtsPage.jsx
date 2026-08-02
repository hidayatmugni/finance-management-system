import { DeleteOutlined, DollarOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Alert, Button, DatePicker, Input, Segmented, Typography } from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useConfigSection, useFormatters } from "../../shared/config/useAppConfig";
import { useCashflowMirror } from "../../shared/data/useCashflowMirror";
import { useStatuses } from "../../shared/data/useCatalogue";
import { useMutations } from "../../shared/data/useMutations";
import { useFinanceStore } from "../../shared/state/useFinanceStore";
import {
  Badge,
  DataTable,
  EmptyState,
  Field,
  Money,
  MoneyField,
  PageHeader,
  ProgressMeter,
  ResponsiveDialog,
  StatCard,
  useToast
} from "../../shared/ui";
import { buildFinanceRecords } from "../../shared/utils/finance";

const EMPTY_RECORD = { personName: "", amount: null, dueDate: "", description: "" };
const EMPTY_PAYMENT = { amount: null, date: dayjs().format("YYYY-MM-DD"), note: "" };

/**
 * Debts and receivables.
 *
 * The remaining balance is always recomputed from the payment log, so a
 * corrected or deleted payment can never leave a record showing the wrong
 * outstanding amount.
 */
export function DebtsPage() {
  const toast = useToast();
  const mutations = useMutations();
  const { mirror } = useCashflowMirror();
  const formatters = useFormatters();
  const general = useConfigSection("general");
  const workflow = useConfigSection("workflow");
  const { get: getStatus } = useStatuses("financeRecord");

  const financeRecords = useFinanceStore((state) => state.financeRecords);
  const financePayments = useFinanceStore((state) => state.financePayments);
  const loading = useFinanceStore((state) => state.loading.finance);

  const [recordType, setRecordType] = useState("debt");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [activeRecord, setActiveRecord] = useState(null);
  const [form, setForm] = useState(EMPTY_RECORD);
  const [paymentForm, setPaymentForm] = useState(EMPTY_PAYMENT);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const allRecords = useMemo(
    () => buildFinanceRecords(financeRecords, financePayments),
    [financeRecords, financePayments],
  );

  const rows = useMemo(
    () => allRecords.filter((record) => record.recordType === recordType),
    [allRecords, recordType],
  );

  const counts = useMemo(
    () => ({
      debt: allRecords.filter((item) => item.recordType === "debt" && !item.isSettled).length,
      receivable: allRecords.filter((item) => item.recordType === "receivable" && !item.isSettled)
        .length
    }),
    [allRecords],
  );

  const stats = useMemo(() => {
    const active = rows.filter((item) => !item.isSettled);
    return {
      activeCount: active.length,
      principal: active.reduce((sum, item) => sum + item.principal, 0),
      paid: rows.reduce((sum, item) => sum + item.paid, 0),
      remaining: active.reduce((sum, item) => sum + item.remaining, 0),
      overdue: active.filter((item) => item.isOverdue)
    };
  }, [rows]);

  const isDebt = recordType === "debt";
  const partyLabel = isDebt ? "Pemberi pinjaman" : "Penerima pinjaman";

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_RECORD);
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    setForm({
      personName: record.personName || "",
      amount: record.principal || null,
      dueDate: record.dueDate || "",
      description: record.description || ""
    });
    setErrors({});
    setDialogOpen(true);
  };

  const submitRecord = async () => {
    const nextErrors = {};
    if (!form.personName.trim()) nextErrors.personName = "Nama pihak wajib diisi.";
    if (!form.amount || form.amount <= 0) nextErrors.amount = "Isi jumlah pokok.";
    if (!form.dueDate) nextErrors.dueDate = "Pilih tanggal jatuh tempo.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = {
      recordType,
      personName: form.personName.trim(),
      amount: Number(form.amount),
      amountInitial: Number(form.amount),
      dueDate: form.dueDate,
      description: form.description.trim(),
      status: "active"
    };

    setSubmitting(true);
    const outcome = editing
      ? await mutations.update("financeRecords", editing.id, payload, {
          context: isDebt ? "hutang" : "piutang",
          successMessage: "Data diperbarui."
        })
      : await mutations.create("financeRecords", payload, {
          context: isDebt ? "hutang" : "piutang",
          successMessage: "Data tersimpan."
        });
    setSubmitting(false);

    if (outcome.ok) setDialogOpen(false);
  };

  const submitPayment = async () => {
    if (!paymentForm.amount || paymentForm.amount <= 0) {
      setErrors({ paymentAmount: "Isi nominal pembayaran." });
      return;
    }

    setSubmitting(true);
    const amount = Number(paymentForm.amount);
    const isDebtRecord = activeRecord.recordType === "debt";

    const outcome = await mutations.create(
      "financePayments",
      {
        financeRecordId: activeRecord.id,
        recordType: activeRecord.recordType,
        personName: activeRecord.personName,
        amount,
        paymentDate: paymentForm.date,
        note: paymentForm.note.trim()
      },
      { context: "pembayaran", successMessage: "Pembayaran tercatat." },
    );

    /*
     * The money actually moved, so the summary has to see it: paying a debt is
     * an expense, collecting a receivable is income. Both land in the "Lainnya"
     * category — the payment itself is not what the budget is about.
     */
    if (outcome.ok && workflow.automation.mirrorDebtPaymentsToCashflow !== false) {
      await mirror({
        preset: isDebtRecord ? "debtPayment" : "receivableCollection",
        amount,
        date: paymentForm.date,
        note: `${isDebtRecord ? "Bayar hutang" : "Terima piutang"} ${activeRecord.personName}`,
        sourceModule: isDebtRecord ? "debt-payment" : "receivable-collection",
        relations: {
          relatedFinanceRecordId: activeRecord.id,
          relatedPaymentId: outcome.result?.id || null
        }
      });
    }

    // Closing a fully-paid record is a CMS-controlled automation.
    if (outcome.ok && workflow.automation.autoCloseSettledDebts) {
      const totalPaid = activeRecord.paid + amount;
      if (totalPaid >= activeRecord.principal) {
        await mutations.update(
          "financeRecords",
          activeRecord.id,
          { status: "paid" },
          { context: "status" },
        );
      }
    }

    setSubmitting(false);
    if (outcome.ok) {
      setPaymentDialog(false);
      setPaymentForm(EMPTY_PAYMENT);
    }
  };

  const handleDelete = (record) => {
    toast.confirm({
      title: `Hapus catatan ${record.personName}?`,
      content:
        record.paymentCount > 0
          ? `Ada ${record.paymentCount} pembayaran terkait. Riwayat itu akan kehilangan induknya.`
          : "Catatan ini belum memiliki pembayaran.",
      okText: "Hapus",
      danger: true,
      onOk: () =>
        mutations.remove("financeRecords", record.id, {
          context: isDebt ? "hutang" : "piutang",
          successMessage: "Catatan dihapus."
        })
    });
  };

  const columns = [
    {
      title: partyLabel,
      dataIndex: "personName",
      render: (value, record) => (
        <div className="min-w-0">
          <Typography.Text className="!block !truncate !font-medium !text-ink">
            {value}
          </Typography.Text>
          {record.description ? (
            <Typography.Text className="!block !truncate !text-caption !text-muted">
              {record.description}
            </Typography.Text>
          ) : null}
        </div>
      )
    },
    {
      title: "Pokok",
      dataIndex: "principal",
      width: 150,
      align: "right",
      sorter: (left, right) => left.principal - right.principal,
      render: (value) => (
        <Typography.Text className="!tabular-nums">{formatters.currency(value)}</Typography.Text>
      )
    },
    {
      title: "Sisa",
      dataIndex: "remaining",
      width: 150,
      align: "right",
      sorter: (left, right) => left.remaining - right.remaining,
      render: (value, record) => (
        <Money value={value} type={record.isSettled ? undefined : isDebt ? "expense" : "income"} />
      )
    },
    {
      title: "Progress",
      key: "progress",
      width: 200,
      render: (_, record) => (
        <ProgressMeter
          value={record.paid}
          max={record.principal}
          size="sm"
          warningAt={101}
          rightHint={`${record.paymentCount} pembayaran`}
        />
      )
    },
    {
      title: "Jatuh tempo",
      dataIndex: "dueDate",
      width: 170,
      render: (value, record) =>
        value ? (
          <div>
            <Typography.Text className="!block !whitespace-nowrap !text-muted">
              {dayjs(value).format(general.dateFormat)}
            </Typography.Text>
            <Badge tone={getStatus(record.status).tone} size="sm">
              {getStatus(record.status).label}
            </Badge>
          </div>
        ) : (
          "—"
        )
    },
    {
      title: "",
      key: "actions",
      width: 170,
      align: "right",
      render: (_, record) => (
        <div className="flex justify-end gap-1">
          {!record.isSettled ? (
            <Button
              size="small"
              type="primary"
              icon={<DollarOutlined />}
              onClick={() => {
                setActiveRecord(record);
                setPaymentForm(EMPTY_PAYMENT);
                setErrors({});
                setPaymentDialog(true);
              }}
            >
              Bayar
            </Button>
          ) : null}
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          />
        </div>
      )
    }
  ];

  const renderMobileCard = (record) => (
    <div className="p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Typography.Text className="!block !truncate !font-semibold !text-ink">
            {record.personName}
          </Typography.Text>
          <Typography.Text className="!block !text-caption !text-muted">
            {record.dueDate ? dayjs(record.dueDate).format(general.dateFormat) : "Tanpa tenggat"}
          </Typography.Text>
        </div>
        <Badge tone={getStatus(record.status).tone}>{getStatus(record.status).label}</Badge>
      </div>

      <ProgressMeter
        className="mt-3"
        value={record.paid}
        max={record.principal}
        warningAt={101}
        leftHint={`Dibayar ${formatters.compact(record.paid)}`}
        rightHint={`Sisa ${formatters.compact(record.remaining)}`}
      />

      {!record.isSettled ? (
        <Button
          className="!mt-3"
          size="small"
          type="primary"
          block
          icon={<DollarOutlined />}
          onClick={() => {
            setActiveRecord(record);
            setPaymentForm(EMPTY_PAYMENT);
            setPaymentDialog(true);
          }}
        >
          Catat pembayaran
        </Button>
      ) : null}
    </div>
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Perencanaan"
        title="Hutang & piutang"
        description="Pantau kewajiban dan tagihan beserta riwayat pembayarannya."
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Tambah {isDebt ? "hutang" : "piutang"}
          </Button>
        }
        tabs={
          <Segmented
            className="ds-segmented-lg"
            value={recordType}
            onChange={setRecordType}
            options={[
              { label: `Hutang (${counts.debt})`, value: "debt" },
              { label: `Piutang (${counts.receivable})`, value: "receivable" }
            ]}
          />
        }
      />

      {stats.overdue.length > 0 ? (
        <Alert
          className="!mb-4"
          type="error"
          showIcon
          title={`${stats.overdue.length} catatan sudah lewat jatuh tempo`}
          description={stats.overdue.map((item) => item.personName).join(", ")}
        />
      ) : null}

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Aktif" value={stats.activeCount} loading={loading} />
        <StatCard
          label="Total pokok"
          value={formatters.compact(stats.principal)}
          tone={isDebt ? "danger" : "success"}
          loading={loading}
        />
        <StatCard
          label="Sudah dibayar"
          value={formatters.compact(stats.paid)}
          tone="success"
          loading={loading}
        />
        <StatCard
          label="Sisa"
          value={formatters.compact(stats.remaining)}
          tone={stats.remaining > 0 ? "warning" : "success"}
          loading={loading}
        />
      </div>

      <DataTable
        dataSource={rows}
        columns={columns}
        renderMobileCard={renderMobileCard}
        loading={loading}
        scrollX={1000}
        emptyState={
          <EmptyState
            title={`Belum ada ${isDebt ? "hutang" : "piutang"}`}
            description={
              isDebt
                ? "Catat pinjaman yang harus dibayar agar jatuh temponya tidak terlewat."
                : "Catat uang yang dipinjam orang lain supaya mudah ditagih."
            }
            action={
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                Tambah {isDebt ? "hutang" : "piutang"}
              </Button>
            }
          />
        }
      />

      <ResponsiveDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={submitRecord}
        submitting={submitting}
        title={`${editing ? "Ubah" : "Tambah"} ${isDebt ? "hutang" : "piutang"}`}
      >
        <Field label={partyLabel} required error={errors.personName}>
          <Input
            size="large"
            value={form.personName}
            onChange={(event) => setForm({ ...form, personName: event.target.value })}
            placeholder="Nama orang atau institusi"
            status={errors.personName ? "error" : undefined}
            autoFocus
          />
        </Field>

        <Field label="Jumlah pokok" required error={errors.amount}>
          <MoneyField
            value={form.amount}
            onChange={(value) => setForm({ ...form, amount: value })}
            currencySymbol={general.currencySymbol}
            locale={general.locale}
            status={errors.amount ? "error" : undefined}
          />
        </Field>

        <Field label="Jatuh tempo" required error={errors.dueDate}>
          <DatePicker
            size="large"
            className="!w-full"
            format={general.dateFormat}
            value={form.dueDate ? dayjs(form.dueDate) : null}
            onChange={(value) =>
              setForm({ ...form, dueDate: value ? value.format("YYYY-MM-DD") : "" })
            }
            status={errors.dueDate ? "error" : undefined}
          />
        </Field>

        <Field label="Keterangan" optional>
          <Input.TextArea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Contoh: pinjaman modal usaha"
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </Field>
      </ResponsiveDialog>

      <ResponsiveDialog
        open={paymentDialog}
        onClose={() => setPaymentDialog(false)}
        onSubmit={submitPayment}
        submitting={submitting}
        title={isDebt ? "Catat pembayaran" : "Catat penerimaan"}
        description={
          activeRecord
            ? `${activeRecord.personName} — sisa ${formatters.currency(activeRecord.remaining)} dari ${formatters.currency(activeRecord.principal)}. Otomatis tercatat sebagai ${isDebt ? "pengeluaran" : "pemasukan"} kategori Lainnya di ringkasan.`
            : null
        }
      >
        <Field label="Nominal pembayaran" required error={errors.paymentAmount}>
          <MoneyField
            value={paymentForm.amount}
            onChange={(value) => setPaymentForm({ ...paymentForm, amount: value })}
            currencySymbol={general.currencySymbol}
            locale={general.locale}
            quickAmounts={activeRecord ? [activeRecord.remaining] : []}
            status={errors.paymentAmount ? "error" : undefined}
            autoFocus
          />
        </Field>

        <Field label="Tanggal" required>
          <DatePicker
            size="large"
            className="!w-full"
            format={general.dateFormat}
            allowClear={false}
            value={paymentForm.date ? dayjs(paymentForm.date) : null}
            onChange={(value) =>
              setPaymentForm({ ...paymentForm, date: value ? value.format("YYYY-MM-DD") : "" })
            }
          />
        </Field>

        <Field label="Catatan" optional>
          <Input
            size="large"
            value={paymentForm.note}
            onChange={(event) => setPaymentForm({ ...paymentForm, note: event.target.value })}
            placeholder="Contoh: transfer bank"
          />
        </Field>
      </ResponsiveDialog>
    </div>
  );
}
