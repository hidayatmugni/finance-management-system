import { Card, Tag, Typography } from "antd";
import { useFinanceStore } from "../../shared/state/useFinanceStore";
import { EmptyState } from "../../shared/components/EmptyState";
import { SectionHeading } from "../../shared/components/SectionHeading";
import { formatCurrency } from "../../shared/utils/format";
import { buildMemberComparison } from "../../shared/utils/finance";

export function MembersPage() {
  const members = useFinanceStore((state) => state.members);
  const transactions = useFinanceStore((state) => state.transactions);
  const memberComparison = buildMemberComparison(transactions);

  if (!members.length) {
    return (
      <div className="space-y-4">
        <SectionHeading eyebrow="Anggota" title="Anggota keluarga dan statistik ringkas" />
        <EmptyState
          title="Belum ada anggota"
          description="Owner akan muncul otomatis setelah login pertama. Anggota tambahan dapat ditambahkan lewat alur keluarga berikutnya."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionHeading eyebrow="Anggota" title="Anggota keluarga dan statistik ringkas" />

      {members.map((member) => {
        const memberName = member.fullName || member.name;
        const stats = memberComparison.find((item) => item.name === memberName);

        return (
          <Card key={member.id} className="finance-card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Typography.Title level={4} className="!mb-0 !text-base">{memberName}</Typography.Title>
                <Typography.Text className="mt-1 block !text-sm !text-muted">{translateRole(member.role)}</Typography.Text>
              </div>
              <Tag className="rounded-full border-0 bg-white/10 px-3 py-1 text-xs font-semibold text-muted">
                {member.status === "inactive" ? "Nonaktif" : "Aktif"}
              </Tag>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Card size="small" className="finance-soft-card">
                <Typography.Text className="metric-label">Pemasukan</Typography.Text>
                <Typography.Text className="mt-2 block text-sm font-bold text-income">
                  {formatCurrency(stats?.income || 0)}
                </Typography.Text>
              </Card>
              <Card size="small" className="finance-soft-card">
                <Typography.Text className="metric-label">Pengeluaran</Typography.Text>
                <Typography.Text className="mt-2 block text-sm font-bold text-expense">
                  {formatCurrency(stats?.expense || 0)}
                </Typography.Text>
              </Card>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function translateRole(role) {
  switch (role) {
    case "owner":
      return "Pemilik";
    case "admin":
      return "Admin";
    case "member":
      return "Anggota";
    default:
      return role;
  }
}
