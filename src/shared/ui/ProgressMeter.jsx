import { Typography } from "antd";
import { useTheme } from "../design/ThemeProvider";
import { cn } from "./utils";

/**
 * Budget / goal progress bar.
 *
 * The colour comes from the ratio, not the caller, so "over limit" looks the
 * same everywhere. Past 100% the bar stays full and the real figure moves to
 * the label — a 240%-wide bar would say nothing.
 */
export function ProgressMeter({
  value = 0,
  max = 0,
  label,
  leftHint,
  rightHint,
  warningAt = 90,
  size = "md",
  showPercent = true,
  className
}) {
  const { colors } = useTheme();

  const percent = max > 0 ? (value / max) * 100 : 0;
  const clamped = Math.min(Math.max(percent, 0), 100);
  const isOver = percent > 100;
  const isNear = !isOver && percent >= warningAt;

  const color = isOver ? colors.danger : isNear ? colors.warning : colors.primary;
  const heights = { sm: "h-1", md: "h-2", lg: "h-2.5" };

  return (
    <div className={cn("min-w-0", className)}>
      {(label || showPercent) && (
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          {label ? (
            <Typography.Text className="!truncate !text-body !font-medium !text-ink">
              {label}
            </Typography.Text>
          ) : (
            <span />
          )}
          {showPercent ? (
            <Typography.Text
              className={cn(
                "!shrink-0 !text-small !font-semibold !tabular-nums",
                isOver ? "!text-danger-ink" : isNear ? "!text-warning-ink" : "!text-muted",
              )}
            >
              {Math.round(percent)}%
            </Typography.Text>
          ) : null}
        </div>
      )}

      <div className={cn("w-full overflow-hidden rounded-full bg-surface-sunken", heights[size])}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>

      {(leftHint || rightHint) && (
        <div className="mt-1.5 flex items-baseline justify-between gap-2">
          <Typography.Text className="!truncate !text-caption !text-muted">
            {leftHint}
          </Typography.Text>
          <Typography.Text
            className={cn("!shrink-0 !text-caption", isOver ? "!text-danger-ink" : "!text-muted")}
          >
            {rightHint}
          </Typography.Text>
        </div>
      )}
    </div>
  );
}
