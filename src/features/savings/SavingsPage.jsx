import { DeleteOutlined, EditOutlined, PlusOutlined, RiseOutlined } from "@ant-design/icons";
import { Button, DatePicker, Input, Typography } from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useConfigSection, useFormatters } from "../../shared/config/useAppConfig";
import { useMutations } from "../../shared/data/useMutations";
import { useFinanceStore } from "../../shared/state/useFinanceStore";
import {
  Badge,
  Card,
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
import { buildGoalProgress, toDateString } from "../../shared/utils/finance";

const EMPTY_GOAL = { name: "", targetAmount: null, targetDate: "", description: "" };
const EMPTY_CONTRIBUTION = { amount: null, date: dayjs().format("YYYY-MM-DD"), note: "" };

/**
 * Savings goals and their contribution history.
 *
 * Progress is recomputed from the contribution log rather than a stored total,
 * so deleting a contribution always corrects the goal automatically.
 */
export function SavingsPage() {
  const toast = useToast();
  const mutations = useMutations();
  const formatters = useFormatters();
  const general = useConfigSection("general");
  const workflow = useConfigSection("workflow");

  const savingsGoals = useFinanceStore((state) => state.savingsGoals);
  const contributions = useFinanceStore((state) => state.savingContributions);
  const loading = useFinanceStore((state) => state.loading.savings);

  const [goalDialog, setGoalDialog] = useState(false);
  const [contributionDialog, setContributionDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [activeGoal, setActiveGoal] = useState(null);
  const [goalForm, setGoalForm] = useState(EMPTY_GOAL);
  const [contributionForm, setContributionForm] = useState(EMPTY_CONTRIBUTION);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const goals = useMemo(
    () => buildGoalProgress(savingsGoals, contributions),
    [savingsGoals, contributions],
  );

  const totals = useMemo(() => {
    const target = goals.reduce((sum, goal) => sum + goal.target, 0);
    const saved = goals.reduce((sum, goal) => sum + goal.contributed, 0);

    return {
      target,
      saved,
      remaining: Math.max(target - saved, 0),
      percent: target > 0 ? (saved / target) * 100 : 0,
      reached: goals.filter((goal) => goal.isReached).length
    };
  }, [goals]);

  const openCreateGoal = () => {
    setEditingGoal(null);
    setGoalForm(EMPTY_GOAL);
    setErrors({});
    setGoalDialog(true);
  };

  const openEditGoal = (goal) => {
    setEditingGoal(goal);
    setGoalForm({
      name: goal.name || "",
      targetAmount: Number(goal.targetAmount) || null,
      targetDate: toDateString(goal.targetDate),
      description: goal.description || ""
    });
    setErrors({});
    setGoalDialog(true);
  };

  const submitGoal = async () => {
    const nextErrors = {};
    if (!goalForm.name.trim()) nextErrors.name = "Nama target wajib diisi.";
    if (!goalForm.targetAmount || goalForm.targetAmount <= 0) {
      nextErrors.targetAmount = "Isi jumlah target.";
    }
    if (!goalForm.targetDate) nextErrors.targetDate = "Pilih tanggal target.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = {
      name: goalForm.name.trim(),
      targetAmount: Number(goalForm.targetAmount),
      targetDate: goalForm.targetDate,
      description: goalForm.description.trim(),
      status: "active"
    };

    setSubmitting(true);
    const outcome = editingGoal
      ? await mutations.update("savingGoals", editingGoal.id, payload, {
          context: "target tabungan",
          successMessage: "Target diperbarui."
        })
      : await mutations.create("savingGoals", payload, {
          context: "target tabungan",
          successMessage: "Target dibuat."
        });
    setSubmitting(false);

    if (outcome.ok) setGoalDialog(false);
  };

  const submitContribution = async () => {
    if (!contributionForm.amount || contributionForm.amount <= 0) {
      setErrors({ amount: "Isi nominal setoran." });
      return;
    }

    setSubmitting(true);
    const outcome = await mutations.create(
      "savingContributions",
      {
        savingGoalId: activeGoal.id,
        goalName: activeGoal.name,
        amount: Number(contributionForm.amount),
        date: contributionForm.date,
        note: contributionForm.note.trim()
      },
      { context: "setoran", successMessage: "Setoran tercatat." },
    );

    // Mirroring into cashflow is a CMS switch, so a family that tracks savings
    // separately from spending isn't forced into double entry.
    if (outcome.ok && workflow.automation.mirrorSavingsToCashflow) {
      await mutations.create(
        "transactions",
        {
          type: "expense",
          amount: Number(contributionForm.amount),
          categoryId: null,
          categoryName: "Tabungan",
          note: `Setoran tabungan ${activeGoal.name}`,
          title: `Setoran tabungan ${activeGoal.name}`,
          date: contributionForm.date,
          sourceModule: "savings",
          relatedSavingGoalId: activeGoal.id
        },
        { context: "transaksi" },
      );
    }

    setSubmitting(false);
    if (outcome.ok) {
      setContributionDialog(false);
      setContributionForm(EMPTY_CONTRIBUTION);
    }
  };

  const handleDeleteGoal = (goal) => {
    toast.confirm({
      title: `Hapus target "${goal.name}"?`,
      content:
        goal.contributionCount > 0
          ? `${goal.contributionCount} setoran akan kehilangan induknya. Hapus riwayat setorannya lebih dulu bila ingin data tetap rapi.`
          : "Target ini belum punya setoran.",
      okText: "Hapus",
      danger: true,
      onOk: () =>
        mutations.remove("savingGoals", goal.id, {
          context: "target tabungan",
          successMessage: "Target dihapus."
        })
    });
  };

  const columns = [
    {
      title: "Target",
      dataIndex: "name",
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
      title: "Terkumpul",
      dataIndex: "contributed",
      width: 160,
      align: "right",
      sorter: (left, right) => left.contributed - right.contributed,
      render: (value) => <Money value={value} className="!text-success-ink" />
    },
    {
      title: "Target",
      dataIndex: "target",
      width: 150,
      align: "right",
      render: (value) => (
        <Typography.Text className="!tabular-nums">{formatters.currency(value)}</Typography.Text>
      )
    },
    {
      title: "Progress",
      key: "progress",
      width: 220,
      render: (_, record) => (
        <ProgressMeter
          value={record.contributed}
          max={record.target}
          size="sm"
          warningAt={101}
          rightHint={record.isReached ? "Tercapai" : `Sisa ${formatters.compact(record.remaining)}`}
        />
      )
    },
    {
      title: "Jatuh tempo",
      dataIndex: "targetDate",
      width: 160,
      render: (value, record) =>
        value ? (
          <div>
            <Typography.Text className="!block !whitespace-nowrap !text-muted">
              {dayjs(value).format(general.dateFormat)}
            </Typography.Text>
            {record.isReached ? (
              <Badge tone="success" size="sm">
                Selesai
              </Badge>
            ) : record.isOverdue ? (
              <Badge tone="danger" size="sm">
                Lewat {Math.abs(record.daysRemaining)} hari
              </Badge>
            ) : (
              <Badge tone="neutral" size="sm">
                {record.daysRemaining} hari lagi
              </Badge>
            )}
          </div>
        ) : (
          "—"
        )
    },
    {
      title: "",
      key: "actions",
      width: 150,
      align: "right",
      render: (_, record) => (
        <div className="flex justify-end gap-1">
          <Button
            size="small"
            type="primary"
            icon={<RiseOutlined />}
            onClick={() => {
              setActiveGoal(record);
              setContributionForm(EMPTY_CONTRIBUTION);
              setErrors({});
              setContributionDialog(true);
            }}
          >
            Setor
          </Button>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditGoal(record)} />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteGoal(record)}
          />
        </div>
      )
    }
  ];

  const renderMobileCard = (record) => (
    <div className="p-3.5">
      <div className="flex items-start justify-between gap-3">
        <Typography.Text className="!min-w-0 !truncate !font-semibold !text-ink">
          {record.name}
        </Typography.Text>
        {record.isReached ? <Badge tone="success">Tercapai</Badge> : null}
      </div>

      <ProgressMeter
        className="mt-3"
        value={record.contributed}
        max={record.target}
        warningAt={101}
        leftHint={`${formatters.compact(record.contributed)} / ${formatters.compact(record.target)}`}
        rightHint={record.targetDate ? dayjs(record.targetDate).format("DD MMM YYYY") : ""}
      />

      <div className="mt-3 flex gap-2">
        <Button
          size="small"
          type="primary"
          block
          icon={<RiseOutlined />}
          onClick={() => {
            setActiveGoal(record);
            setContributionForm(EMPTY_CONTRIBUTION);
            setContributionDialog(true);
          }}
        >
          Setor
        </Button>
        <Button size="small" icon={<EditOutlined />} onClick={() => openEditGoal(record)} block>
          Ubah
        </Button>
      </div>
    </div>
  );

  const recentContributions = useMemo(
    () =>
      [...contributions]
        .map((item) => ({ ...item, date: toDateString(item.date) }))
        .sort((left, right) => right.date.localeCompare(left.date))
        .slice(0, 6),
    [contributions],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Perencanaan"
        title="Tabungan"
        description="Tetapkan target, catat setoran, dan pantau progresnya."
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateGoal}>
            Buat target
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total target" value={formatters.compact(totals.target)} loading={loading} />
        <StatCard
          label="Terkumpul"
          value={formatters.compact(totals.saved)}
          tone="success"
          helper={`${Math.round(totals.percent)}% dari target`}
          loading={loading}
        />
        <StatCard label="Sisa" value={formatters.compact(totals.remaining)} loading={loading} />
        <StatCard
          label="Tercapai"
          value={`${totals.reached}/${goals.length}`}
          tone={totals.reached > 0 ? "success" : "default"}
          loading={loading}
        />
      </div>

      <DataTable
        dataSource={goals}
        columns={columns}
        renderMobileCard={renderMobileCard}
        loading={loading}
        scrollX={980}
        emptyState={
          <EmptyState
            title="Belum ada target tabungan"
            description="Target membuat menabung terasa terukur — tetapkan nominal dan tanggalnya, lalu catat setoran kapan pun."
            action={
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateGoal}>
                Buat target
              </Button>
            }
          />
        }
      />

      {recentContributions.length > 0 ? (
        <Card className="mt-4 p-4">
          <Typography.Text className="ds-eyebrow !mb-3 !block">Setoran terbaru</Typography.Text>
          <ul className="divide-y divide-line">
            {recentContributions.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <Typography.Text className="!block !truncate !text-body !text-ink">
                    {item.goalName || "Setoran"}
                  </Typography.Text>
                  <Typography.Text className="!block !text-caption !text-muted">
                    {dayjs(item.date).format(general.dateFormat)}
                    {item.note ? ` · ${item.note}` : ""}
                  </Typography.Text>
                </div>
                <Money value={item.amount} className="!text-success-ink" />
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <ResponsiveDialog
        open={goalDialog}
        onClose={() => setGoalDialog(false)}
        onSubmit={submitGoal}
        submitting={submitting}
        title={editingGoal ? "Ubah target" : "Buat target tabungan"}
      >
        <Field label="Nama target" required error={errors.name}>
          <Input
            size="large"
            value={goalForm.name}
            onChange={(event) => setGoalForm({ ...goalForm, name: event.target.value })}
            placeholder="Contoh: Dana darurat, Liburan, Motor"
            status={errors.name ? "error" : undefined}
            autoFocus
          />
        </Field>

        <Field label="Jumlah target" required error={errors.targetAmount}>
          <MoneyField
            value={goalForm.targetAmount}
            onChange={(value) => setGoalForm({ ...goalForm, targetAmount: value })}
            currencySymbol={general.currencySymbol}
            locale={general.locale}
            status={errors.targetAmount ? "error" : undefined}
          />
        </Field>

        <Field label="Tanggal target" required error={errors.targetDate}>
          <DatePicker
            size="large"
            className="!w-full"
            format={general.dateFormat}
            value={goalForm.targetDate ? dayjs(goalForm.targetDate) : null}
            onChange={(value) =>
              setGoalForm({ ...goalForm, targetDate: value ? value.format("YYYY-MM-DD") : "" })
            }
            status={errors.targetDate ? "error" : undefined}
          />
        </Field>

        <Field label="Catatan" optional>
          <Input.TextArea
            value={goalForm.description}
            onChange={(event) => setGoalForm({ ...goalForm, description: event.target.value })}
            placeholder="Kenapa target ini penting?"
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </Field>
      </ResponsiveDialog>

      <ResponsiveDialog
        open={contributionDialog}
        onClose={() => setContributionDialog(false)}
        onSubmit={submitContribution}
        submitting={submitting}
        title={`Setor ke ${activeGoal?.name || ""}`}
        description={
          activeGoal
            ? `Terkumpul ${formatters.currency(activeGoal.contributed)} dari ${formatters.currency(activeGoal.target)}.`
            : null
        }
      >
        <Field label="Nominal setoran" required error={errors.amount}>
          <MoneyField
            value={contributionForm.amount}
            onChange={(value) => setContributionForm({ ...contributionForm, amount: value })}
            currencySymbol={general.currencySymbol}
            locale={general.locale}
            quickAmounts={general.quickAmounts}
            status={errors.amount ? "error" : undefined}
            autoFocus
          />
        </Field>

        <Field label="Tanggal" required>
          <DatePicker
            size="large"
            className="!w-full"
            format={general.dateFormat}
            allowClear={false}
            value={contributionForm.date ? dayjs(contributionForm.date) : null}
            onChange={(value) =>
              setContributionForm({
                ...contributionForm,
                date: value ? value.format("YYYY-MM-DD") : ""
              })
            }
          />
        </Field>

        <Field label="Catatan" optional>
          <Input
            size="large"
            value={contributionForm.note}
            onChange={(event) =>
              setContributionForm({ ...contributionForm, note: event.target.value })
            }
            placeholder="Contoh: sisa gaji bulan ini"
          />
        </Field>
      </ResponsiveDialog>
    </div>
  );
}
