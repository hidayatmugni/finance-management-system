import {
  CalendarOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  DollarOutlined,
  EditOutlined,
  PlusOutlined,
  UnorderedListOutlined
} from "@ant-design/icons";
import { Alert, Button, DatePicker, Input, InputNumber, Segmented, Typography } from "antd";
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

const TENOR_PRESETS = [3, 6, 12, 24, 36];

const EMPTY_RECORD = {
  personName: "",
  amount: null,
  tenorMonths: 12,
  startDate: dayjs().format("YYYY-MM-DD"),
  description: ""
};

const EMPTY_PAYMENT = { amount: null, date: dayjs().format("YYYY-MM-DD"), note: "" };

/**
 * Instalment tracking.
 *
 * An instalment is a debt with a plan attached: a principal split over a tenor,
 * one payment a month. It shares the `financeRecords` / `financePayments`
 * collections with debts and receivables — same payment log, same recomputed
 * balance — and is told apart by `recordType: "installment"`.
 *
 * Every payment recorded here also becomes an expense under the bills category,
 * because an instalment leaving the account is spending like any other.
 */
export function InstallmentsPage() {
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

  const [filter, setFilter] = useState("active");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [activeRecord, setActiveRecord] = useState(null);
  const [form, setForm] = useState(EMPTY_RECORD);
  const [paymentForm, setPaymentForm] = useState(EMPTY_PAYMENT);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const allRecords = useMemo(
    () =>
      buildFinanceRecords(financeRecords, financePayments).filter(
        (record) => record.recordType === "installment",
      ),
    [financeRecords, financePayments],
  );

  const rows = useMemo(
    () =>
      allRecords.filter((record) => (filter === "active" ? !record.isSettled : record.isSettled)),
    [allRecords, filter],
  );

  const counts = useMemo(
    () => ({
      active: allRecords.filter((item) => !item.isSettled).length,
      settled: allRecords.filter((item) => item.isSettled).length
    }),
    [allRecords],
  );

  const stats = useMemo(() => {
    const active = allRecords.filter((item) => !item.isSettled);

    return {
      activeCount: active.length,
      // What the household owes every month while all of these run in parallel.
      monthlyLoad: active.reduce((sum, item) => sum + item.monthlyAmount, 0),
      paid: allRecords.reduce((sum, item) => sum + item.paid, 0),
      remaining: active.reduce((sum, item) => sum + item.remaining, 0),
      overdue: active.filter((item) => item.isOverdue)
    };
  }, [allRecords]);

  /** Live preview of the monthly instalment while the form is being filled. */
  const previewMonthly = useMemo(() => {
    const total = Number(form.amount) || 0;
    const tenor = Number(form.tenorMonths) || 0;
    return tenor > 0 ? Math.round(total / tenor) : 0;
  }, [form.amount, form.tenorMonths]);

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
      tenorMonths: record.tenorMonths || 12,
      startDate: record.startDate || dayjs().format("YYYY-MM-DD"),
      description: record.description || ""
    });
    setErrors({});
    setDialogOpen(true);
  };

  const submitRecord = async () => {
    const nextErrors = {};
    if (!form.personName.trim()) nextErrors.personName = "Nama cicilan wajib diisi.";
    if (!form.amount || form.amount <= 0) nextErrors.amount = "Isi total pokok cicilan.";
    if (!form.tenorMonths || form.tenorMonths < 1) nextErrors.tenorMonths = "Tenor minimal 1 bulan.";
    if (!form.startDate) nextErrors.startDate = "Pilih tanggal setoran pertama.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const total = Number(form.amount);
    const tenor = Math.round(Number(form.tenorMonths));

    const payload = {
      recordType: "installment",
      personName: form.personName.trim(),
      amount: total,
      amountInitial: total,
      tenorMonths: tenor,
      // Rounded to whole rupiah so a paid instalment matches the plan exactly;
      // the schedule gives the final month whatever rounding is left over.
      monthlyAmount: Math.round(total / tenor),
      startDate: form.startDate,
      // The final month, so the record still has a meaningful deadline of its
      // own even where nothing looks at the schedule.
      dueDate: dayjs(form.startDate).add(tenor - 1, "month").format("YYYY-MM-DD"),
      description: form.description.trim(),
      status: "active"
    };

    setSubmitting(true);
    const outcome = editing
      ? await mutations.update("financeRecords", editing.id, payload, {
          context: "cicilan",
          successMessage: "Cicilan diperbarui."
        })
      : await mutations.create("financeRecords", payload, {
          context: "cicilan",
          successMessage: "Cicilan tersimpan."
        });
    setSubmitting(false);

    if (outcome.ok) setDialogOpen(false);
  };

  const openPayment = (record) => {
    setActiveRecord(record);
    setPaymentForm({
      // Prefilled with the instalment due, which is what gets paid nine times
      // out of ten. Rounded because nobody transfers fractions of a rupiah.
      amount: Math.round(
        Math.min(record.nextInstallment?.amount ?? record.monthlyAmount, record.remaining),
      ),
      date: dayjs().format("YYYY-MM-DD"),
      note: ""
    });
    setErrors({});
    setPaymentDialog(true);
  };

  const submitPayment = async () => {
    if (!paymentForm.amount || paymentForm.amount <= 0) {
      setErrors({ paymentAmount: "Isi nominal setoran." });
      return;
    }

    setSubmitting(true);
    const amount = Number(paymentForm.amount);
    const installmentNumber = activeRecord.nextInstallment?.number ?? null;

    const outcome = await mutations.create(
      "financePayments",
      {
        financeRecordId: activeRecord.id,
        recordType: "installment",
        personName: activeRecord.personName,
        installmentNumber,
        amount,
        paymentDate: paymentForm.date,
        note: paymentForm.note.trim()
      },
      { context: "setoran cicilan", successMessage: "Setoran cicilan tercatat." },
    );

    // An instalment paid is money out of the wallet: it belongs in the summary
    // under the bills category.
    if (outcome.ok && workflow.automation.mirrorInstallmentsToCashflow !== false) {
      await mirror({
        preset: "installmentPayment",
        amount,
        date: paymentForm.date,
        note: installmentNumber
          ? `Cicilan ${activeRecord.personName} (${installmentNumber}/${activeRecord.tenorMonths})`
          : `Cicilan ${activeRecord.personName}`,
        sourceModule: "installment-payment",
        relations: {
          relatedFinanceRecordId: activeRecord.id,
          relatedPaymentId: outcome.result?.id || null,
          installmentNumber
        }
      });
    }

    // Same automation as debts: a fully-paid plan closes itself.
    if (outcome.ok && workflow.automation.autoCloseSettledDebts) {
      if (activeRecord.paid + amount >= activeRecord.principal) {
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
      title: `Hapus cicilan ${record.personName}?`,
      content:
        record.paymentCount > 0
          ? `Ada ${record.paymentCount} setoran terkait. Transaksi pengeluaran yang sudah tercatat di ringkasan tidak ikut terhapus.`
          : "Cicilan ini belum memiliki setoran.",
      okText: "Hapus",
      danger: true,
      onOk: () =>
        mutations.remove("financeRecords", record.id, {
          context: "cicilan",
          successMessage: "Cicilan dihapus."
        })
    });
  };

  const columns = [
    {
      title: "Cicilan",
      dataIndex: "personName",
      render: (value, record) => (
        <div className="min-w-0">
          <Typography.Text className="!block !truncate !font-medium !text-ink">
            {value}
          </Typography.Text>
          <Typography.Text className="!block !truncate !text-caption !text-muted">
            {record.description || `Tenor ${record.tenorMonths} bulan`}
          </Typography.Text>
        </div>
      )
    },
    {
      title: "Angsuran / bulan",
      dataIndex: "monthlyAmount",
      width: 160,
      align: "right",
      sorter: (left, right) => left.monthlyAmount - right.monthlyAmount,
      render: (value) => (
        <Typography.Text className="!tabular-nums !font-medium">
          {formatters.currency(value)}
        </Typography.Text>
      )
    },
    {
      title: "Progress",
      key: "progress",
      width: 220,
      render: (_, record) => (
        <ProgressMeter
          value={record.paid}
          max={record.principal}
          size="sm"
          warningAt={101}
          rightHint={`${record.paidInstallments}/${record.tenorMonths} bulan`}
        />
      )
    },
    {
      title: "Sisa",
      dataIndex: "remaining",
      width: 150,
      align: "right",
      sorter: (left, right) => left.remaining - right.remaining,
      render: (value, record) => (
        <Money value={value} type={record.isSettled ? undefined : "expense"} />
      )
    },
    {
      title: "Setoran berikutnya",
      dataIndex: "dueDate",
      width: 180,
      render: (value, record) =>
        record.isSettled ? (
          <Badge tone="success" size="sm">
            Lunas
          </Badge>
        ) : value ? (
          <div>
            <Typography.Text className="!block !whitespace-nowrap !text-muted">
              {dayjs(value).format(general.dateFormat)}
            </Typography.Text>
            <Badge tone={getStatus(record.status).tone} size="sm">
              {record.isOverdue
                ? `Telat ${Math.abs(record.daysRemaining)} hari`
                : `${record.daysRemaining} hari lagi`}
            </Badge>
          </div>
        ) : (
          "—"
        )
    },
    {
      title: "",
      key: "actions",
      width: 200,
      align: "right",
      render: (_, record) => (
        <div className="flex justify-end gap-1">
          {!record.isSettled ? (
            <Button
              size="small"
              type="primary"
              icon={<DollarOutlined />}
              onClick={() => openPayment(record)}
            >
              Setor
            </Button>
          ) : null}
          <Button
            type="text"
            size="small"
            icon={<UnorderedListOutlined />}
            onClick={() => {
              setActiveRecord(record);
              setScheduleDialog(true);
            }}
            aria-label="Lihat jadwal"
          />
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
            {formatters.currency(record.monthlyAmount)} × {record.tenorMonths} bulan
          </Typography.Text>
        </div>
        <Badge tone={record.isSettled ? "success" : getStatus(record.status).tone}>
          {record.isSettled ? "Lunas" : getStatus(record.status).label}
        </Badge>
      </div>

      <ProgressMeter
        className="mt-3"
        value={record.paid}
        max={record.principal}
        warningAt={101}
        leftHint={`${record.paidInstallments}/${record.tenorMonths} bulan`}
        rightHint={`Sisa ${formatters.compact(record.remaining)}`}
      />

      {!record.isSettled && record.dueDate ? (
        <Typography.Text className="!mt-2 !flex !items-center !gap-1 !text-caption !text-muted">
          <CalendarOutlined />
          Setoran berikutnya {dayjs(record.dueDate).format(general.dateFormat)}
        </Typography.Text>
      ) : null}

      <div className="mt-3 flex gap-2">
        {!record.isSettled ? (
          <Button
            size="small"
            type="primary"
            block
            icon={<DollarOutlined />}
            onClick={() => openPayment(record)}
          >
            Setor cicilan
          </Button>
        ) : null}
        <Button
          size="small"
          block
          icon={<UnorderedListOutlined />}
          onClick={() => {
            setActiveRecord(record);
            setScheduleDialog(true);
          }}
        >
          Jadwal
        </Button>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Perencanaan"
        title="Cicilan"
        description="Catat cicilan beserta tenornya. Setiap setoran otomatis tercatat sebagai pengeluaran kategori Tagihan."
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Tambah cicilan
          </Button>
        }
        tabs={
          <Segmented
            className="ds-segmented-lg"
            value={filter}
            onChange={setFilter}
            options={[
              { label: `Berjalan (${counts.active})`, value: "active" },
              { label: `Lunas (${counts.settled})`, value: "settled" }
            ]}
          />
        }
      />

      {stats.overdue.length > 0 ? (
        <Alert
          className="!mb-4"
          type="error"
          showIcon
          title={`${stats.overdue.length} cicilan lewat jatuh tempo`}
          description={stats.overdue.map((item) => item.personName).join(", ")}
        />
      ) : null}

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Cicilan berjalan" value={stats.activeCount} loading={loading} />
        <StatCard
          label="Beban per bulan"
          value={formatters.compact(stats.monthlyLoad)}
          tone="warning"
          helper="Total angsuran aktif"
          loading={loading}
        />
        <StatCard
          label="Sudah dibayar"
          value={formatters.compact(stats.paid)}
          tone="success"
          loading={loading}
        />
        <StatCard
          label="Sisa pokok"
          value={formatters.compact(stats.remaining)}
          tone={stats.remaining > 0 ? "danger" : "success"}
          loading={loading}
        />
      </div>

      <DataTable
        dataSource={rows}
        columns={columns}
        renderMobileCard={renderMobileCard}
        loading={loading}
        scrollX={1100}
        emptyState={
          <EmptyState
            title={filter === "active" ? "Belum ada cicilan berjalan" : "Belum ada cicilan lunas"}
            description="Catat cicilan beserta tenornya — aplikasi menghitung angsuran bulanan dan mengingatkan setoran berikutnya."
            action={
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                Tambah cicilan
              </Button>
            }
          />
        }
      />

      {/* ------------------------------------------------------- record form */}
      <ResponsiveDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={submitRecord}
        submitting={submitting}
        title={`${editing ? "Ubah" : "Tambah"} cicilan`}
      >
        <Field label="Nama cicilan" required error={errors.personName}>
          <Input
            size="large"
            value={form.personName}
            onChange={(event) => setForm({ ...form, personName: event.target.value })}
            placeholder="Contoh: Motor Honda — Adira"
            status={errors.personName ? "error" : undefined}
            autoFocus
          />
        </Field>

        <Field label="Total pokok cicilan" required error={errors.amount}>
          <MoneyField
            value={form.amount}
            onChange={(value) => setForm({ ...form, amount: value })}
            currencySymbol={general.currencySymbol}
            locale={general.locale}
            status={errors.amount ? "error" : undefined}
          />
        </Field>

        <Field
          label="Tenor (bulan)"
          required
          error={errors.tenorMonths}
          hint={
            previewMonthly > 0
              ? `Angsuran per bulan ${formatters.currency(previewMonthly)}`
              : "Angsuran dihitung otomatis dari total dibagi tenor."
          }
        >
          <div className="space-y-2">
            <InputNumber
              className="!w-full"
              size="large"
              min={1}
              max={360}
              value={form.tenorMonths}
              onChange={(value) => setForm({ ...form, tenorMonths: value ?? null })}
              status={errors.tenorMonths ? "error" : undefined}
              addonAfter="bulan"
            />
            <div className="flex flex-wrap gap-1.5">
              {TENOR_PRESETS.map((tenor) => (
                <Button
                  key={tenor}
                  size="small"
                  type={form.tenorMonths === tenor ? "primary" : "default"}
                  onClick={() => setForm({ ...form, tenorMonths: tenor })}
                >
                  {tenor}x
                </Button>
              ))}
            </div>
          </div>
        </Field>

        <Field label="Setoran pertama" required error={errors.startDate}>
          <DatePicker
            size="large"
            className="!w-full"
            format={general.dateFormat}
            value={form.startDate ? dayjs(form.startDate) : null}
            onChange={(value) =>
              setForm({ ...form, startDate: value ? value.format("YYYY-MM-DD") : "" })
            }
            status={errors.startDate ? "error" : undefined}
          />
        </Field>

        <Field label="Keterangan" optional>
          <Input.TextArea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Contoh: cicilan motor, jatuh tempo tanggal 5"
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </Field>
      </ResponsiveDialog>

      {/* ---------------------------------------------------- payment dialog */}
      <ResponsiveDialog
        open={paymentDialog}
        onClose={() => setPaymentDialog(false)}
        onSubmit={submitPayment}
        submitting={submitting}
        title="Setor cicilan"
        description={
          activeRecord
            ? `${activeRecord.personName} — angsuran ${activeRecord.nextInstallment?.number ?? activeRecord.tenorMonths} dari ${activeRecord.tenorMonths}. Sisa pokok ${formatters.currency(activeRecord.remaining)}. Otomatis tercatat sebagai pengeluaran kategori Tagihan.`
            : null
        }
      >
        {/* Prefilled with the angsuran due, so the usual case is one tap. The
            quick-amount chips are deliberately left off: they add to the current
            value, which would double an already-filled instalment. */}
        <Field
          label="Nominal setoran"
          required
          error={errors.paymentAmount}
          hint={
            activeRecord
              ? `Angsuran ${formatters.currency(activeRecord.monthlyAmount)} · sisa pokok ${formatters.currency(activeRecord.remaining)}`
              : undefined
          }
        >
          <MoneyField
            value={paymentForm.amount}
            onChange={(value) => setPaymentForm({ ...paymentForm, amount: value })}
            currencySymbol={general.currencySymbol}
            locale={general.locale}
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
            placeholder="Contoh: transfer via mobile banking"
          />
        </Field>
      </ResponsiveDialog>

      {/* --------------------------------------------------- schedule dialog */}
      <ResponsiveDialog
        open={scheduleDialog}
        onClose={() => setScheduleDialog(false)}
        title={`Jadwal ${activeRecord?.personName || "cicilan"}`}
        description={
          activeRecord
            ? `${activeRecord.paidInstallments} dari ${activeRecord.tenorMonths} bulan terbayar.`
            : null
        }
        footer={null}
        width={460}
      >
        <ul className="divide-y divide-line">
          {(activeRecord?.schedule || []).map((item) => (
            <li key={item.number} className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[12px] font-medium ${
                    item.isPaid
                      ? "bg-success-soft text-success-ink"
                      : item.isPartial
                        ? "bg-warning-soft text-warning-ink"
                        : "bg-surface-sunken text-muted"
                  }`}
                >
                  {item.isPaid ? <CheckCircleOutlined /> : item.number}
                </span>
                <div className="min-w-0">
                  <Typography.Text className="!block !text-body !text-ink">
                    Bulan ke-{item.number}
                  </Typography.Text>
                  <Typography.Text className="!block !text-caption !text-muted">
                    {item.dueDate ? dayjs(item.dueDate).format(general.dateFormat) : "—"}
                    {item.isPartial ? ` · dibayar ${formatters.compact(item.paidAmount)}` : ""}
                  </Typography.Text>
                </div>
              </div>
              <Money value={item.amount} className={item.isPaid ? "!text-muted" : undefined} />
            </li>
          ))}
        </ul>
      </ResponsiveDialog>
    </div>
  );
}
