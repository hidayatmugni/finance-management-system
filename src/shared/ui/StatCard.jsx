import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";
import { Tooltip, Typography } from "antd";
import { Card } from "./Card";
import { Skeleton } from "./Skeleton";
import { cn } from "./utils";

const TONES = {
  default: { text: "text-ink", chip: "bg-surface-sunken text-muted" },
  primary: { text: "text-primary-ink", chip: "bg-primary-soft text-primary-ink" },
  success: { text: "text-success-ink", chip: "bg-success/10 text-success-ink" },
  warning: { text: "text-warning-ink", chip: "bg-warning/10 text-warning-ink" },
  danger: { text: "text-danger-ink", chip: "bg-danger/10 text-danger-ink" },
  info: { text: "text-info-ink", chip: "bg-info/10 text-info-ink" }
};

/**
 * The KPI tile used across dashboard, reports and list headers.
 *
 * @param {object} props
 * @param {string} props.label      Short metric name.
 * @param {React.ReactNode} props.value Formatted value — already localised.
 * @param {number} [props.delta]    Percentage change; sign drives the arrow.
 * @param {string} [props.deltaLabel] Context for the delta, e.g. "vs last month".
 * @param {'default'|'primary'|'success'|'warning'|'danger'|'info'} [props.tone]
 */
export function StatCard({
  label,
  value,
  delta,
  deltaLabel,
  helper,
  icon,
  tone = "default",
  loading = false,
  onClick,
  className
}) {
  const toneStyle = TONES[tone] || TONES.default;
  const hasDelta = typeof delta === "number" && Number.isFinite(delta);
  const isPositive = hasDelta && delta >= 0;

  if (loading) {
    return (
      <Card className={cn("min-h-[104px]", className)}>
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-3 h-7 w-32" />
        <Skeleton className="mt-3 h-3 w-24" />
      </Card>
    );
  }

  return (
    <Card
      interactive={Boolean(onClick)}
      onClick={onClick}
      className={cn("min-h-[104px]", onClick && "cursor-pointer", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <Typography.Text className="ds-eyebrow !truncate">{label}</Typography.Text>
        {icon ? (
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[15px]",
              toneStyle.chip,
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>

      <Typography.Text
        className={cn("!mt-2 !block !text-[22px] !font-bold !leading-tight", toneStyle.text)}
      >
        {value}
      </Typography.Text>

      {(hasDelta || helper) && (
        <div className="mt-2 flex items-center gap-2">
          {hasDelta ? (
            <Tooltip title={deltaLabel}>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-semibold",
                  isPositive ? "bg-success/10 text-success-ink" : "bg-danger/10 text-danger-ink",
                )}
              >
                {isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                {Math.abs(delta).toFixed(1)}%
              </span>
            </Tooltip>
          ) : null}
          {helper ? (
            <Typography.Text className="!truncate !text-[11px] !text-muted">{helper}</Typography.Text>
          ) : null}
        </div>
      )}
    </Card>
  );
}
