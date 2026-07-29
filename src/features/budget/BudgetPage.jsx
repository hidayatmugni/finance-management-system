import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  WarningOutlined
} from "@ant-design/icons";
import { Button, Input, Typography } from "antd";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useConfigSection, useFormatters } from "../../shared/config/useAppConfig";
import { useCatalogue } from "../../shared/data/useCatalogue";
import { useMutations } from "../../shared/data/useMutations";
import { useFinanceStore } from "../../shared/state/useFinanceStore";
import {
  Badge,
  Card,
  DataTable,
  EmptyState,
  Field,
  MoneyField,
  PageHeader,
  ProgressMeter,
  ResponsiveDialog,
  SearchSelect,
  StatCard,
  useToast
} from "../../shared/ui";
import { buildBudgetUsage, filterByRange, sumAmount } from "../../shared/utils/finance";
import { getCurrentBookMonthRange } from "../../shared/utils/dateFilters";

const EMPTY_FORM = { categoryId: "", monthlyLimit: null, note: "" };

/**
 * Budget planning.
 *
 * Usage is derived from live transactions for the current book period rather
 * than a stored counter, so the numbers can never drift out of date.
 */
export function BudgetPage() {
  const toast = useToast();
  const mutations = useMutations();
  const formatters = useFormatters();
  const catalogue = useCatalogue();

  const general = useConfigSection("general");
  const notifications = useConfigSection("notifications");

  const budgets = useFinanceStore((state) => state.budgets);
  const transactions = useFinanceStore((state) => state.transactions);
  const loading = useFinanceStore((state) => state.loading.budgets);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const period = useMemo(() => getCurrentBookMonthRange(general), [general]);

  const usage = useMemo(() => {
    const periodTransactions = filterByRange(transactions, period.startDate, period.endDate);
    return buildBudgetUsage(
      budgets,
      periodTransactions,
      catalogue.categories,
      notifications.budgetAlertThreshold,
    );
  }, [budgets, transactions, catalogue.categories, notifications.budgetAlertThreshold, period]);

  const totals = useMemo(() => {
    const limit = usage.reduce((total, item) => total + item.limit, 0);
    const spent = usage.reduce((total, item) => total + item.spent, 0);

    return {
      limit,
      spent,
      remaining: limit - spent,
      percent: limit > 0 ? (spent / limit) * 100 : 0,
      overCount: usage.filter((item) => item.isOver).length,
      nearCount: usage.filter((item) => item.isNearLimit).length
    };
  }, [usage]);

  /** Categories already budgeted can't be picked twice — one limit per category. */
  const categoryOptions = useMemo(() => {
    const taken = new Set(
      budgets.filter((item) => item.id !== editing?.id).map((item) => item.categoryId),
    );

    return catalogue
      .categoryOptions("expense")
      .filter((option) => !taken.has(option.value));
  }, [catalogue, budgets, editing]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (budget) => {
    setEditing(budget);
    setForm({
      categoryId: budget.categoryId || "",
      monthlyLimit: Number(budget.monthlyLimit ?? budget.amount ?? 0) || null,
      note: budget.note || ""
    });
    setErrors({});
    setDialogOpen(true);
  };

  const validate = (values) => {
    const nextErrors = {};
    if (!values.categoryId) nextErrors.categoryId = "Pilih kategori terlebih dulu.";
    if (!values.monthlyLimit || Number(values.monthlyLimit) <= 0) {
      nextErrors.monthlyLimit = "Isi limit bulanan lebih dari 0.";
    }
    return nextErrors;
  };

  /** Realtime validation: clear a field's error as soon as it becomes valid. */
  const patchForm = (patch) => {
    const next = { ...form, ...patch };
    setForm(next);
    if (Object.keys(errors).length > 0) setErrors(validate(next));
  };

  const handleSubmit = async () => {
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const category = catalogue.getCategory(form.categoryId);
    const payload = {
      categoryId: form.categoryId,
      categoryName: category?.name || form.categoryId,
      categoryColor: category?.color || null,
      monthlyLimit: Number(form.monthlyLimit),
      note: form.note.trim(),
      period: "monthly"
    };

    setSubmitting(true);
    const outcome = editing
      ? await mutations.update("budgets", editing.id, payload, {
          context: "anggaran",
          successMessage: "Anggaran diperbarui."
        })
      : await mutations.create("budgets", payload, {
          context: "anggaran",
          successMessage: "Anggaran tersimpan."
        });
    setSubmitting(false);

    if (outcome.ok) {
      setDialogOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
    }
  };

  const handleDelete = (budget) => {
    toast.confirm({
      title: "Hapus anggaran ini?",
      content: `Limit untuk ${budget.categoryName} akan dihapus. Transaksinya tidak ikut terhapus.`,
      okText: "Hapus",
      danger: true,
      onOk: () =>
        mutations.remove("budgets", budget.id, {
          context: "anggaran",
          successMessage: "Anggaran dihapus."
        })
    });
  };

  const columns = [
    {
      title: "Kategori",
      dataIndex: "categoryName",
      render: (value, record) => (
        <div className="flex items-center gap-2">
          {record.categoryColor ? (
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: record.categoryColor }}
              aria-hidden
            />
          ) : null}
          <div className="min-w-0">
            <Typography.Text className="!block !truncate !font-medium !text-ink">
              {value}
            </Typography.Text>
            {record.note ? (
              <Typography.Text className="!block !truncate !text-caption !text-muted">
                {record.note}
              </Typography.Text>
            ) : null}
          </div>
        </div>
      )
    },
    {
      title: "Limit",
      dataIndex: "limit",
      width: 140,
      align: "right",
      sorter: (left, right) => left.limit - right.limit,
      render: (value) => (
        <Typography.Text className="!tabular-nums">{formatters.currency(value)}</Typography.Text>
      )
    },
    {
      title: "Terpakai",
      dataIndex: "spent",
      width: 140,
      align: "right",
      sorter: (left, right) => left.spent - right.spent,
      render: (value, record) => (
        <Typography.Text
          className={`!tabular-nums !font-semibold ${record.isOver ? "!text-danger-ink" : "!text-ink"}`}
        >
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
          value={record.spent}
          max={record.limit}
          size="sm"
          warningAt={notifications.budgetAlertThreshold}
          rightHint={
            record.remaining >= 0
              ? `Sisa ${formatters.compact(record.remaining)}`
              : `Lebih ${formatters.compact(Math.abs(record.remaining))}`
          }
        />
      )
    },
    {
      title: "",
      key: "actions",
      width: 92,
      align: "right",
      render: (_, record) => (
        <div className="flex justify-end gap-1">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
            aria-label="Ubah anggaran"
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
            aria-label="Hapus anggaran"
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
            {record.categoryName}
          </Typography.Text>
          {record.note ? (
            <Typography.Text className="!block !truncate !text-caption !text-muted">
              {record.note}
            </Typography.Text>
          ) : null}
        </div>
        {record.isOver ? (
          <Badge tone="danger" icon={<WarningOutlined />}>
            Lewat limit
          </Badge>
        ) : record.isNearLimit ? (
          <Badge tone="warning">Hampir habis</Badge>
        ) : null}
      </div>

      <ProgressMeter
        className="mt-3"
        value={record.spent}
        max={record.limit}
        warningAt={notifications.budgetAlertThreshold}
        leftHint={`${formatters.compact(record.spent)} / ${formatters.compact(record.limit)}`}
        rightHint={
          record.remaining >= 0
            ? `Sisa ${formatters.compact(record.remaining)}`
            : `Lebih ${formatters.compact(Math.abs(record.remaining))}`
        }
      />

      <div className="mt-3 flex gap-2">
        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} block>
          Ubah
        </Button>
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} block>
          Hapus
        </Button>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Perencanaan"
        title="Anggaran"
        description={`Periode ${period.label}`}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Buat anggaran
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total limit"
          value={formatters.compact(totals.limit)}
          helper={`${usage.length} kategori`}
          loading={loading}
        />
        <StatCard
          label="Terpakai"
          value={formatters.compact(totals.spent)}
          tone={totals.percent > 100 ? "danger" : "default"}
          helper={`${Math.round(totals.percent)}% dari limit`}
          loading={loading}
        />
        <StatCard
          label="Sisa"
          value={formatters.compact(Math.abs(totals.remaining))}
          tone={totals.remaining >= 0 ? "success" : "danger"}
          helper={totals.remaining >= 0 ? "Masih tersedia" : "Melebihi anggaran"}
          loading={loading}
        />
        <StatCard
          label="Perlu perhatian"
          value={`${totals.overCount + totals.nearCount}`}
          tone={totals.overCount > 0 ? "danger" : totals.nearCount > 0 ? "warning" : "success"}
          helper={`${totals.overCount} lewat · ${totals.nearCount} hampir`}
          loading={loading}
        />
      </div>

      {usage.length > 0 ? (
        <Card className="mb-4 p-4">
          <ProgressMeter
            label="Total anggaran periode ini"
            value={totals.spent}
            max={totals.limit}
            size="lg"
            warningAt={notifications.budgetAlertThreshold}
            leftHint={`${formatters.currency(totals.spent)} terpakai`}
            rightHint={`${formatters.currency(totals.limit)} limit`}
          />
        </Card>
      ) : null}

      <DataTable
        dataSource={usage}
        columns={columns}
        renderMobileCard={renderMobileCard}
        loading={loading}
        scrollX={860}
        emptyState={
          <EmptyState
            title={catalogue.isEmpty ? "Buat kategori dulu" : "Belum ada anggaran"}
            description={
              catalogue.isEmpty
                ? "Anggaran dipasang per kategori pengeluaran. Buat kategori terlebih dahulu, lalu kembali ke sini."
                : "Tetapkan limit bulanan per kategori supaya pengeluaran mudah dikendalikan."
            }
            action={
              catalogue.isEmpty ? (
                <Link to="/dashboard/categories">
                  <Button type="primary" icon={<PlusOutlined />}>
                    Kelola kategori
                  </Button>
                </Link>
              ) : (
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  Buat anggaran
                </Button>
              )
            }
          />
        }
      />

      <ResponsiveDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
        title={editing ? "Ubah anggaran" : "Buat anggaran"}
        submitLabel={editing ? "Simpan perubahan" : "Simpan anggaran"}
      >
        <Field label="Kategori" required error={errors.categoryId}>
          <SearchSelect
            options={categoryOptions}
            value={form.categoryId}
            onChange={(value) => patchForm({ categoryId: value })}
            status={errors.categoryId ? "error" : undefined}
            placeholder="Cari kategori pengeluaran"
            autoFocus
          />
        </Field>

        {/* Notes sit directly under the category, where the context for them is. */}
        <Field
          label="Catatan"
          optional
          hint="Alasan atau patokan angka ini — muncul di daftar anggaran."
        >
          <Input.TextArea
            value={form.note}
            onChange={(event) => patchForm({ note: event.target.value })}
            placeholder="Contoh: naik 10% karena harga bahan pokok"
            autoSize={{ minRows: 2, maxRows: 4 }}
            maxLength={180}
            showCount
          />
        </Field>

        <Field label="Limit bulanan" required error={errors.monthlyLimit}>
          <MoneyField
            value={form.monthlyLimit}
            onChange={(value) => patchForm({ monthlyLimit: value })}
            currencySymbol={general.currencySymbol}
            locale={general.locale}
            quickAmounts={general.quickAmounts}
            status={errors.monthlyLimit ? "error" : undefined}
          />
        </Field>

        {form.categoryId ? (
          <SpentPreview
            categoryId={form.categoryId}
            transactions={transactions}
            period={period}
            limit={form.monthlyLimit}
            formatters={formatters}
          />
        ) : null}
      </ResponsiveDialog>
    </div>
  );
}

/** Shows what the chosen category already cost, so the limit isn't a guess. */
function SpentPreview({ categoryId, transactions, period, limit, formatters }) {
  const spent = useMemo(() => {
    const periodTransactions = filterByRange(transactions, period.startDate, period.endDate);
    return sumAmount(
      periodTransactions.filter(
        (item) => item.type === "expense" && item.categoryId === categoryId,
      ),
    );
  }, [transactions, period, categoryId]);

  return (
    <Card className="bg-surface-sunken p-3">
      <Typography.Text className="!block !text-caption !text-muted">
        Pengeluaran kategori ini pada periode berjalan
      </Typography.Text>
      <Typography.Text className="!mt-1 !block !text-subtitle !font-bold !text-ink">
        {formatters.currency(spent)}
      </Typography.Text>
      {limit > 0 ? (
        <ProgressMeter className="mt-2.5" value={spent} max={Number(limit)} size="sm" />
      ) : null}
    </Card>
  );
}
