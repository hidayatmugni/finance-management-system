import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { Alert, Button, Card, DatePicker, Input, InputNumber, Progress, Select, Space, Tag, Typography } from "antd";
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
    <div className="space-y-4">
      <SectionHeading eyebrow="Tabungan" title="Target dan histori setoran tabungan" />

      <Card className="finance-card finance-soft-card">
        <Space orientation="vertical" size={12} className="w-full">
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
          <div className="grid grid-cols-2 gap-3">
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
        <Space orientation="vertical" size={12} className="w-full">
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
          <div className="grid grid-cols-2 gap-3">
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

      {savingsGoals.map((goal) => {
        const progress = Math.min((Number(goal.currentAmount || 0) / Number(goal.targetAmount || 1)) * 100, 100);
        const goalContributions = savingContributions.filter((item) => item.savingGoalId === goal.id);

        return (
          <Card key={goal.id} className="finance-card">
            <Space orientation="vertical" size={16} className="w-full">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Typography.Title level={4} className="!mb-0 !text-base">
                    {goal.name}
                  </Typography.Title>
                  <Typography.Text className="mt-1 block !text-sm !text-muted">
                    Target selesai {formatDate(goal.targetDate)}
                  </Typography.Text>
                </div>
                <Tag className="rounded-full border-0 bg-white/10 px-3 py-1 text-xs font-semibold text-muted">
                  {goal.status === "completed" ? "Selesai" : "Aktif"}
                </Tag>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Card size="small" className="finance-soft-card">
                  <Typography.Text className="metric-label">Terkumpul</Typography.Text>
                  <Typography.Text className="mt-2 block text-base font-extrabold text-savings">
                    {formatCurrency(goal.currentAmount)}
                  </Typography.Text>
                </Card>
                <Card size="small" className="finance-soft-card">
                  <Typography.Text className="metric-label">Target</Typography.Text>
                  <Typography.Text className="mt-2 block text-base font-extrabold text-ink">
                    {formatCurrency(goal.targetAmount)}
                  </Typography.Text>
                </Card>
              </div>

              <Progress percent={progress} showInfo={false} strokeColor="#4da3ff" railColor="#1b2532" />

              <div>
                <Typography.Text className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Riwayat setoran
                </Typography.Text>
                <Space orientation="vertical" size={12} className="mt-3 w-full">
                  {goalContributions.length ? (
                    goalContributions.map((item) => (
                      <Card key={item.id} size="small" className="finance-soft-card">
                        <div className="flex items-center justify-between gap-3">
                          <Typography.Text strong className="!text-sm">{formatCurrency(item.amount)}</Typography.Text>
                          <Typography.Text className="!text-xs !text-muted">{formatDate(item.date)}</Typography.Text>
                        </div>
                        <Typography.Text className="mt-2 block !text-sm !text-muted">
                          {item.note || "Setoran tabungan"}
                        </Typography.Text>
                      </Card>
                    ))
                  ) : (
                    <Alert type="info" showIcon title="Belum ada setoran pada target ini." />
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
