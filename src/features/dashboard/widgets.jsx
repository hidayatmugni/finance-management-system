import { ArrowRightOutlined, CalendarOutlined, WarningOutlined } from "@ant-design/icons";
import { Button, Typography } from "antd";
import { Link } from "react-router-dom";
import { renderIcon } from "../../shared/config/iconRegistry";
import {
  Badge,
  DonutChart,
  EmptyState,
  Money,
  ProgressMeter,
  RankedBarList,
  SectionCard,
  StatCard,
  TrendChart
} from "../../shared/ui";

/**
 * Dashboard widget renderers.
 *
 * Each widget is a pure presentational component driven by the `data` bundle
 * the page computes once. Adding a widget type means adding a case here and an
 * entry in the CMS's `WIDGET_TYPES` list — nothing else.
 */

export function BalanceWidget({ data, formatters, labels, loading }) {
  const { summary, balance, savingsBalance, deltas } = data;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <StatCard
        label={labels.balance}
        value={formatters.compact(balance)}
        tone={balance >= 0 ? "primary" : "danger"}
        icon={renderIcon("wallet")}
        helper="Dipakai sehari-hari"
        loading={loading}
      />
      {/* Savings left the running balance as an expense — this is where that
          money is, so the two tiles together are the household's real total. */}
      <StatCard
        label={labels.savingsBalance || "Saldo tabungan"}
        value={formatters.compact(savingsBalance || 0)}
        tone="info"
        icon={renderIcon("savings")}
        helper="Simpanan, di luar saldo berjalan"
        loading={loading}
      />
      <StatCard
        label={labels.income}
        value={formatters.compact(summary.income)}
        tone="success"
        icon={renderIcon("arrow-down")}
        delta={deltas.income}
        deltaLabel="Dibanding periode lalu"
        loading={loading}
      />
      <StatCard
        label={labels.expense}
        value={formatters.compact(summary.expense)}
        tone="danger"
        icon={renderIcon("arrow-up")}
        delta={deltas.expense}
        deltaLabel="Dibanding periode lalu"
        loading={loading}
      />
      <StatCard
        label={labels.netCashflow}
        value={formatters.compact(summary.net)}
        tone={summary.net >= 0 ? "success" : "danger"}
        icon={renderIcon("trend")}
        helper={`Rasio tabung ${formatters.percent(summary.savingRate)}`}
        loading={loading}
      />
    </div>
  );
}

export function CashflowWidget({ widget, data, formatters }) {
  return (
    <SectionCard title={widget.title} description={data.period.label}>
      <TrendChart
        data={data.dailySeries}
        series={[
          { key: "income", label: "Masuk", color: data.colors.income },
          { key: "expense", label: "Keluar", color: data.colors.expense }
        ]}
        height={260}
        valueFormatter={formatters.currency}
        axisFormatter={formatters.compact}
        emptyLabel="Belum ada transaksi pada periode ini"
      />
    </SectionCard>
  );
}

export function IncomeExpenseWidget({ widget, data, formatters }) {
  return (
    <SectionCard title={widget.title} description={`Tahun ${data.year}`}>
      <TrendChart
        variant="bar"
        data={data.monthlySeries}
        series={[
          { key: "income", label: "Masuk", color: data.colors.income },
          { key: "expense", label: "Keluar", color: data.colors.expense }
        ]}
        height={260}
        valueFormatter={formatters.currency}
        axisFormatter={formatters.compact}
      />
    </SectionCard>
  );
}

export function CategoriesWidget({ widget, data, formatters }) {
  const total = data.categoryBreakdown.reduce((sum, item) => sum + item.value, 0);

  return (
    <SectionCard
      title={widget.title}
      description={data.period.label}
      action={
        <Link to="/dashboard/reports">
          <Button type="text" size="small" icon={<ArrowRightOutlined />} iconPosition="end">
            Laporan
          </Button>
        </Link>
      }
    >
      {data.categoryBreakdown.length === 0 ? (
        <EmptyState compact title="Belum ada pengeluaran" description="Catat transaksi untuk melihat rinciannya." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <DonutChart
            data={data.categoryBreakdown.slice(0, 6)}
            height={220}
            valueFormatter={formatters.currency}
            centerLabel="Total"
            centerValue={formatters.compact(total)}
          />
          <RankedBarList
            items={data.categoryBreakdown}
            valueFormatter={formatters.compact}
            max={5}
          />
        </div>
      )}
    </SectionCard>
  );
}

export function BudgetWidget({ widget, data, formatters, alertThreshold }) {
  return (
    <SectionCard
      title={widget.title}
      description={`${data.budgetUsage.length} kategori dianggarkan`}
      action={
        <Link to="/dashboard/budget">
          <Button type="text" size="small" icon={<ArrowRightOutlined />} iconPosition="end">
            Kelola
          </Button>
        </Link>
      }
    >
      {data.budgetUsage.length === 0 ? (
        <EmptyState
          compact
          title="Belum ada anggaran"
          description="Tetapkan limit per kategori untuk mengendalikan pengeluaran."
          action={
            <Link to="/dashboard/budget">
              <Button type="primary" size="small">
                Buat anggaran
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {data.budgetUsage.slice(0, 5).map((budget) => (
            <ProgressMeter
              key={budget.id}
              label={budget.categoryName}
              value={budget.spent}
              max={budget.limit}
              warningAt={alertThreshold}
              leftHint={`${formatters.compact(budget.spent)} / ${formatters.compact(budget.limit)}`}
              rightHint={
                budget.remaining >= 0
                  ? `Sisa ${formatters.compact(budget.remaining)}`
                  : `Lebih ${formatters.compact(Math.abs(budget.remaining))}`
              }
            />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export function BillsWidget({ widget, data, formatters }) {
  return (
    <SectionCard
      title={widget.title}
      description="Jatuh tempo terdekat"
      action={
        <Link to="/dashboard/debts">
          <Button type="text" size="small" icon={<ArrowRightOutlined />} iconPosition="end">
            Semua
          </Button>
        </Link>
      }
    >
      {data.upcomingBills.length === 0 ? (
        <EmptyState compact title="Tidak ada tagihan" description="Semua kewajiban sudah tertangani." />
      ) : (
        <ul className="space-y-2">
          {data.upcomingBills.slice(0, 5).map((bill) => {
            // For an instalment only this month's angsuran is due, not the whole
            // remaining principal.
            const isInstallment = bill.recordType === "installment";
            const amountDue = isInstallment
              ? (bill.nextInstallment?.amount ?? bill.monthlyAmount)
              : bill.remaining;

            return (
            <li
              key={bill.id}
              className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2.5"
            >
              <div className="min-w-0">
                <Typography.Text className="!block !truncate !font-medium !text-ink">
                  {bill.personName}
                </Typography.Text>
                <Typography.Text className="!flex !items-center !gap-1 !text-caption !text-muted">
                  <CalendarOutlined />
                  {bill.dueDate}
                  {isInstallment
                    ? ` · cicilan ${bill.nextInstallment?.number ?? bill.paidInstallments + 1}/${bill.tenorMonths}`
                    : ""}
                </Typography.Text>
              </div>
              <div className="shrink-0 text-right">
                <Money value={amountDue} className="!text-body" />
                {bill.isOverdue ? (
                  <Badge tone="danger" size="sm" icon={<WarningOutlined />} className="mt-1">
                    {Math.abs(bill.daysRemaining)} hari lewat
                  </Badge>
                ) : (
                  <Badge tone={bill.isDueSoon ? "warning" : "neutral"} size="sm" className="mt-1">
                    {bill.daysRemaining} hari lagi
                  </Badge>
                )}
              </div>
            </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

export function GoalsWidget({ widget, data, formatters }) {
  return (
    <SectionCard
      title={widget.title}
      description={`${data.goals.length} target aktif`}
      action={
        <Link to="/dashboard/savings">
          <Button type="text" size="small" icon={<ArrowRightOutlined />} iconPosition="end">
            Kelola
          </Button>
        </Link>
      }
    >
      {data.goals.length === 0 ? (
        <EmptyState
          compact
          title="Belum ada target"
          description="Tetapkan target tabungan supaya progresnya terlihat."
          action={
            <Link to="/dashboard/savings">
              <Button type="primary" size="small">
                Buat target
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {data.goals.slice(0, 4).map((goal) => (
            <ProgressMeter
              key={goal.id}
              label={goal.name}
              value={goal.contributed}
              max={goal.target}
              warningAt={101}
              leftHint={`${formatters.compact(goal.contributed)} / ${formatters.compact(goal.target)}`}
              rightHint={
                goal.isReached
                  ? "Tercapai"
                  : goal.daysRemaining !== null
                    ? `${goal.daysRemaining} hari lagi`
                    : ""
              }
            />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export function RecentWidget({ widget, data, formatters, catalogue }) {
  return (
    <SectionCard
      title={widget.title}
      description={data.period.label}
      action={
        <Link to="/dashboard/transactions">
          <Button type="text" size="small" icon={<ArrowRightOutlined />} iconPosition="end">
            Semua transaksi
          </Button>
        </Link>
      }
      bodyClassName="p-0"
    >
      {data.recent.length === 0 ? (
        <EmptyState
          compact
          title="Belum ada transaksi"
          description="Catatan pertama Anda akan muncul di sini."
          action={
            <Link to="/dashboard/add">
              <Button type="primary" size="small">
                Catat transaksi
              </Button>
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-line">
          {data.recent.map((item) => {
            const color = catalogue.getCategoryColor(item.categoryId);

            return (
              <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[15px]"
                  style={{
                    backgroundColor: color ? `${color}1F` : undefined,
                    color: color || undefined
                  }}
                >
                  {renderIcon(catalogue.getCategory(item.categoryId)?.icon || "tag")}
                </span>

                <div className="min-w-0 flex-1">
                  <Typography.Text className="!block !truncate !font-medium !text-ink">
                    {item.note || catalogue.getCategoryName(item.categoryId)}
                  </Typography.Text>
                  <Typography.Text className="!block !truncate !text-caption !text-muted">
                    {catalogue.getCategoryName(item.categoryId)} · {item.date}
                  </Typography.Text>
                </div>

                <Money value={item.amount} type={item.type} className="shrink-0" />
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

export function QuickActionsWidget({ widget, actions }) {
  const tones = {
    primary: "bg-primary-soft text-primary-ink",
    success: "bg-success-soft text-success-ink",
    warning: "bg-warning-soft text-warning-ink",
    danger: "bg-danger-soft text-danger-ink",
    info: "bg-info-soft text-info-ink"
  };

  return (
    <SectionCard title={widget.title}>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {actions.map((action) => (
          <Link key={action.id} to={action.path} className="!no-underline">
            <span className="ds-card ds-card-interactive flex flex-col items-center gap-2 p-3.5 text-center">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-md text-[18px] ${
                  tones[action.tone] || tones.primary
                }`}
              >
                {renderIcon(action.icon)}
              </span>
              <Typography.Text className="!text-small !font-medium !text-ink">
                {action.label}
              </Typography.Text>
            </span>
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}
