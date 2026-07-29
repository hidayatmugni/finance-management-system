import { Select, Typography } from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useConfigSection, usePermissions } from "../../shared/config/useAppConfig";
import { globalFamilyId } from "../../shared/firebase/config";
import {
  describeFirestoreError,
  updateMemberRole
} from "../../shared/firebase/firestoreHousehold";
import { useFinanceStore } from "../../shared/state/useFinanceStore";
import { useAuth } from "../auth/AuthProvider";
import {
  Badge,
  DataTable,
  EmptyState,
  PageHeader,
  StatCard,
  useToast
} from "../../shared/ui";
import { buildMemberBreakdown, filterByRange } from "../../shared/utils/finance";
import { getCurrentBookMonthRange } from "../../shared/utils/dateFilters";

/** Household members and their roles. */
export function MembersPage() {
  const toast = useToast();
  const { profile } = useAuth();
  const access = useConfigSection("access");
  const general = useConfigSection("general");
  const { can } = usePermissions(profile?.role);

  const members = useFinanceStore((state) => state.members);
  const transactions = useFinanceStore((state) => state.transactions);
  const family = useFinanceStore((state) => state.family);
  const loading = useFinanceStore((state) => state.loading.members);

  const [savingId, setSavingId] = useState("");

  const rows = useMemo(() => {
    const period = getCurrentBookMonthRange(general);
    const periodTransactions = filterByRange(transactions, period.startDate, period.endDate);
    const activity = new Map(
      buildMemberBreakdown(periodTransactions, members).map((item) => [item.id, item]),
    );

    return members.map((member) => ({
      ...member,
      name: member.fullName || member.name || member.email || member.id,
      activity: activity.get(member.id) || { income: 0, expense: 0, count: 0 }
    }));
  }, [members, transactions, general]);

  const canManage = can("member.manage");

  const handleRoleChange = async (member, role) => {
    setSavingId(member.id);
    try {
      await updateMemberRole(family?.id || globalFamilyId, member.id, role);
      toast.success(`Peran ${member.name} diubah.`);
    } catch (error) {
      toast.error(describeFirestoreError(error, "peran anggota"));
    } finally {
      setSavingId("");
    }
  };

  const columns = [
    {
      title: "Anggota",
      dataIndex: "name",
      render: (value, record) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-small font-semibold text-primary-ink">
            {value
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase())
              .join("")}
          </span>
          <div className="min-w-0">
            <Typography.Text className="!block !truncate !font-medium !text-ink">
              {value}
            </Typography.Text>
            <Typography.Text className="!block !truncate !text-caption !text-muted">
              {record.email || record.id}
            </Typography.Text>
          </div>
        </div>
      )
    },
    {
      title: "Peran",
      dataIndex: "role",
      width: 200,
      render: (value, record) =>
        canManage ? (
          <Select
            size="small"
            className="!w-full"
            value={value || access.defaultRole}
            loading={savingId === record.id}
            onChange={(role) => handleRoleChange(record, role)}
            options={access.roles.map((role) => ({ value: role.id, label: role.label }))}
          />
        ) : (
          <Badge tone="primary">
            {access.roles.find((role) => role.id === value)?.label || value || "member"}
          </Badge>
        )
    },
    {
      title: "Transaksi periode ini",
      key: "count",
      width: 180,
      align: "right",
      sorter: (left, right) => left.activity.count - right.activity.count,
      render: (_, record) => (
        <Typography.Text className="!tabular-nums !text-muted">
          {record.activity.count}
        </Typography.Text>
      )
    },
    {
      title: "Bergabung",
      dataIndex: "createdAt",
      width: 150,
      render: (value) => (
        <Typography.Text className="!whitespace-nowrap !text-muted">
          {value?.seconds ? dayjs(value.seconds * 1000).format(general.dateFormat) : "—"}
        </Typography.Text>
      )
    }
  ];

  const renderMobileCard = (record) => (
    <div className="p-3.5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-small font-semibold text-primary-ink">
          {record.name.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <Typography.Text className="!block !truncate !font-semibold !text-ink">
            {record.name}
          </Typography.Text>
          <Typography.Text className="!block !truncate !text-caption !text-muted">
            {record.email}
          </Typography.Text>
        </div>
        <Badge tone="primary">
          {access.roles.find((role) => role.id === record.role)?.label || "member"}
        </Badge>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Pengaturan"
        title="Anggota"
        description="Siapa saja yang punya akses, dan sebesar apa aksesnya. Definisi peran diatur di halaman konfigurasi."
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total anggota" value={members.length} loading={loading} />
        {access.roles.slice(0, 3).map((role) => (
          <StatCard
            key={role.id}
            label={role.label}
            value={members.filter((member) => member.role === role.id).length}
            helper={role.description}
            loading={loading}
          />
        ))}
      </div>

      <DataTable
        dataSource={rows}
        columns={columns}
        renderMobileCard={renderMobileCard}
        loading={loading}
        scrollX={760}
        emptyState={
          <EmptyState
            title="Belum ada anggota"
            description="Anggota muncul otomatis setelah mereka masuk untuk pertama kali dengan akun Firebase."
          />
        }
      />
    </div>
  );
}
