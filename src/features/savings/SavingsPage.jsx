import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, DatePicker, Input, InputNumber, Modal, Progress, Select, Space, Table, Tag, Typography } from "antd";
import { EmptyState } from "../../shared/components/EmptyState";
import { SectionHeading } from "../../shared/components/SectionHeading";
import { formatCurrency, formatDate } from "../../shared/utils/format";
import {
  createSavingContribution,
  createSavingGoal,
  updateSavingGoal
} from "../../shared/firebase/firestoreHousehold.js";
import { useAuth } from "../auth/AuthProvider";
import { useFinanceStore } from "../../shared/state/useFinanceStore";
import { createTransaction } from "../../shared/firebase/firestoreTransactions";
import { themePalette } from "../../shared/config/themePalette";

export function SavingsPage() {
  const family = useFinanceStore((state) => state.family);
  const savingsGoals = useFinanceStore((state) => state.savingsGoals);
  const savingContributions = useFinanceStore((state) => state.savingContributions);
  const members = useFinanceStore((state) => state.members);
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [activeGoalId, setActiveGoalId] = useState("");
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionDate, setContributionDate] = useState(new Date().toISOString().slice(0, 10));
  const [contributionNote, setContributionNote] = useState("");
  const [goalAlert, setGoalAlert] = useState(null);
  const [contributionAlert, setContributionAlert] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);

  useEffect(() => {
    if (!goalAlert) return undefined;
    const timeoutId = window.setTimeout(() => setGoalAlert(null), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [goalAlert]);

  useEffect(() => {
    if (!contributionAlert) return undefined;
    const timeoutId = window.setTimeout(() => setContributionAlert(null), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [contributionAlert]);

  const memberName = useMemo(() => {
    const member = members.find((item) => item.id === user?.uid);
    return member?.fullName || member?.name || user?.displayName || user?.email || "Tanpa nama";
  }, [members, user?.displayName, user?.email, user?.uid]);

  const handleCreateGoal = async () => {
    setGoalAlert(null);
    if (!family?.id || !name.trim() || !targetAmount || !targetDate) {
      setGoalAlert({
        type: "warning",
        title: "Lengkapi nama target, nominal, dan tanggal target terlebih dahulu."
      });
      return;
    }

    try {
      await createSavingGoal(family.id, {
        familyId: family.id,
        userId: user?.uid || "",
        name: name.trim(),
        targetAmount: Number(targetAmount),
        currentAmount: 0,
        targetDate,
        status: "active"
      });

      setName("");
      setTargetAmount("");
      setTargetDate("");
      setGoalAlert({
        type: "success",
        title: "Target tabungan berhasil disimpan."
      });
    } catch (error) {
      setGoalAlert({
        type: "error",
        title: error instanceof Error ? error.message : "Gagal menyimpan target tabungan."
      });
    }
  };

  const handleCreateContribution = async () => {
    const goal = savingsGoals.find((item) => item.id === activeGoalId);
    setContributionAlert(null);
    if (!family?.id || !goal || !contributionAmount || !contributionDate) {
      setContributionAlert({
        type: "warning",
        title: "Pilih target tabungan, isi nominal setoran, dan tanggal setoran."
      });
      return;
    }

    try {
      const amount = Number(contributionAmount);
      const nextCurrentAmount = Number(goal.currentAmount || 0) + amount;
      const nextStatus = nextCurrentAmount >= Number(goal.targetAmount || 0) ? "completed" : goal.status || "active";

      await createSavingContribution(family.id, {
        familyId: family.id,
        savingGoalId: goal.id,
        userId: user?.uid || "",
        amount,
        date: contributionDate,
        note: contributionNote.trim()
      });

      await updateSavingGoal(family.id, goal.id, {
        currentAmount: nextCurrentAmount,
        status: nextStatus
      });

      await createTransaction({
        familyId: family.id,
        payload: {
          familyId: family.id,
          userId: user?.uid || "",
          createdBy: user?.uid || "",
          ownershipType: "shared",
          type: "expense",
          categoryId: "tabungan",
          accountId: null,
          amount,
          date: contributionDate,
          note: contributionNote.trim() || `Setoran tabungan ${goal.name}`,
          tags: ["tabungan"],
          syncStatus: "synced",
          title: `Setoran tabungan ${goal.name}`,
          memberName,
          categoryName: "Tabungan",
          sourceModule: "savings",
          relatedSavingGoalId: goal.id
        }
      });

      setContributionAmount("");
      setContributionDate(new Date().toISOString().slice(0, 10));
      setContributionNote("");
      setActiveGoalId("");
      setContributionAlert({
        type: "success",
        title: "Setoran tabungan berhasil disimpan."
      });
    } catch (error) {
      setContributionAlert({
        type: "error",
        title: error instanceof Error ? error.message : "Gagal menyimpan setoran tabungan."
      });
    }
  };

  return (
    <div className="space-y-2.5">
      <SectionHeading eyebrow="Tabungan" title="Target dan histori setoran tabungan" />

      <Card className="finance-card finance-soft-card">
        <Space orientation="vertical" size={10} className="w-full">
          <Typography.Title level={4} className="!m-0 !text-sm !font-bold">
            Buat target tabungan
          </Typography.Title>
          {goalAlert ? (
            <Alert
              type={goalAlert.type}
              showIcon
              title={goalAlert.title}
              closable={{ closeIcon: true, onClose: () => setGoalAlert(null), "aria-label": "close" }}
            />
          ) : null}
          <Input value={name} onChange={(event) => setName(event.target.value)} size="large" placeholder="Contoh: Dana darurat" />
          <div className="grid grid-cols-2 gap-2">
            <InputNumber
              value={targetAmount || null}
              onChange={(value) => setTargetAmount(String(value || ""))}
              size="large"
              className="!w-full"
              min={0}
              controls={false}
              placeholder="Nominal target"
            />
            <DatePicker
              value={targetDate ? dayjs(targetDate) : null}
              onChange={(value) => setTargetDate(value ? value.format("YYYY-MM-DD") : "")}
              size="large"
              className="!w-full"
              format="DD MMM YYYY"
            />
          </div>
          <Button type="primary" size="large" onClick={handleCreateGoal} block>
            Simpan target tabungan
          </Button>
        </Space>
      </Card>

      <Card className="finance-card finance-soft-card">
        <Space orientation="vertical" size={10} className="w-full">
          <Typography.Title level={4} className="!m-0 !text-sm !font-bold">
            Input setoran tabungan
          </Typography.Title>
          {contributionAlert ? (
            <Alert
              type={contributionAlert.type}
              showIcon
              title={contributionAlert.title}
              closable={{ closeIcon: true, onClose: () => setContributionAlert(null), "aria-label": "close" }}
            />
          ) : null}
          <Select
            value={activeGoalId || undefined}
            onChange={setActiveGoalId}
            size="large"
            placeholder="Pilih target tabungan"
            options={savingsGoals.map((goal) => ({ value: goal.id, label: goal.name }))}
          />
          <div className="grid grid-cols-2 gap-2">
            <InputNumber
              value={contributionAmount || null}
              onChange={(value) => setContributionAmount(String(value || ""))}
              size="large"
              className="!w-full"
              min={0}
              controls={false}
              placeholder="Nominal setoran"
            />
            <DatePicker
              value={contributionDate ? dayjs(contributionDate) : null}
              onChange={(value) => setContributionDate(value ? value.format("YYYY-MM-DD") : "")}
              size="large"
              className="!w-full"
              format="DD MMM YYYY"
            />
          </div>
          <Input.TextArea
            value={contributionNote}
            onChange={(event) => setContributionNote(event.target.value)}
            autoSize={{ minRows: 3, maxRows: 5 }}
            placeholder="Contoh: Setoran dari sisa gaji minggu ini"
          />
          <Button type="primary" size="large" onClick={handleCreateContribution} block>
            Simpan setoran
          </Button>
        </Space>
      </Card>

      {!savingsGoals.length ? (
        <EmptyState
          title="Belum ada target tabungan"
          description="Buat target tabungan dulu, lalu catat setoran agar progresnya bisa dilihat dengan jelas."
        />
      ) : null}

      {savingsGoals.length ? (
        <Card className="finance-card" styles={{ body: { padding: 0, overflow: "hidden" } }}>
          <Table
            size="small"
            rowKey="id"
            pagination={false}
            dataSource={savingsGoals}
            scroll={{ x: 420, y: 430 }}
            onRow={(record) => ({
              onClick: () => setSelectedGoal(record)
            })}
            columns={[
              {
                title: "Tabungan",
                dataIndex: "name",
                render: (value, item) => (
                  <div>
                    <Typography.Text strong className="!text-[13px] !font-semibold">
                      {value}
                    </Typography.Text>
                    <Typography.Text className={`block !text-[11px] !font-medium ${getSavingStatusTextClass(item.status)}`}>
                      {getSavingStatusLabel(item.status)}
                    </Typography.Text>
                  </div>
                )
              },
              {
                title: "Progress",
                key: "progress",
                width: 120,
                render: (_, item) => {
                  const progress = Math.min((Number(item.currentAmount || 0) / Number(item.targetAmount || 1)) * 100, 100);
                  return (
                    <Typography.Text className="!text-[12px] !font-medium !text-ink">
                      {Math.round(progress)}%
                    </Typography.Text>
                  );
                }
              },
              {
                title: "Target",
                dataIndex: "targetAmount",
                width: 140,
                align: "right",
                render: (value) => (
                  <Typography.Text className="!text-[12px] !font-medium !text-muted">
                    {formatCurrency(value)}
                  </Typography.Text>
                )
              }
            ]}
          />
        </Card>
      ) : null}

      <SavingDetailModal
        goal={selectedGoal}
        contributions={savingContributions.filter((item) => item.savingGoalId === selectedGoal?.id)}
        onClose={() => setSelectedGoal(null)}
      />
    </div>
  );
}

function SavingDetailModal({ goal, contributions, onClose }) {
  const open = Boolean(goal);
  const progress = goal
    ? Math.min((Number(goal.currentAmount || 0) / Number(goal.targetAmount || 1)) * 100, 100)
    : 0;

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
      {goal ? (
        <Space orientation="vertical" size={12} className="w-full">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Typography.Title level={4} className="!mb-0 !text-[15px]">
                {goal.name}
              </Typography.Title>
              <Typography.Text className="mt-1 block !text-[12px] !text-muted">
                Target selesai {formatDate(goal.targetDate)}
              </Typography.Text>
            </div>
            <Tag className={`rounded-full border-0 px-3 py-1 text-xs font-semibold ${getSavingStatusTagClass(goal.status)}`}>
              {getSavingStatusLabel(goal.status)}
            </Tag>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <Typography.Text className="text-[11px] font-medium text-muted">
                Terkumpul {formatCurrency(goal.currentAmount || 0)} dari {formatCurrency(goal.targetAmount || 0)}
              </Typography.Text>
            </div>
            <Progress
              percent={Math.round(progress)}
              strokeColor={themePalette.colors.primaryStrong}
              railColor={themePalette.colors.progressRail}
            />
          </div>

          <div>
            <Typography.Text className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Riwayat setoran
            </Typography.Text>
            <div className="mt-2.5 max-h-[248px] overflow-y-auto rounded-[12px] border border-line">
              {contributions.length ? (
                contributions.map((item, index) => (
                  <div
                    key={item.id}
                    className={`bg-panel px-3 py-2 ${index === contributions.length - 1 ? "" : "border-b border-line"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Typography.Text strong className="!text-[13px] !font-semibold">
                        {formatCurrency(item.amount)}
                      </Typography.Text>
                      <Typography.Text className="!text-[11px] !text-muted">
                        {formatDate(item.date)}
                      </Typography.Text>
                    </div>
                    <Typography.Text className="mt-0.5 block !text-[12px] !text-muted">
                      {item.note || "Setoran tabungan"}
                    </Typography.Text>
                  </div>
                ))
              ) : (
                <Alert type="info" showIcon title="Belum ada setoran pada target ini." />
              )}
            </div>
          </div>
        </Space>
      ) : null}
    </Modal>
  );
}

function getSavingStatusLabel(status) {
  switch (status) {
    case "completed":
      return "Selesai";
    case "paused":
      return "Dijeda";
    default:
      return "Aktif";
  }
}

function getSavingStatusTagClass(status) {
  switch (status) {
    case "completed":
      return "bg-income/15 text-income";
    case "paused":
      return "bg-warning/15 text-warning";
    default:
      return "bg-primary/15 text-primary";
  }
}

function getSavingStatusTextClass(status) {
  switch (status) {
    case "completed":
      return "!text-income";
    case "paused":
      return "!text-warning";
    default:
      return "!text-primary";
  }
}
