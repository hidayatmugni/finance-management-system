import { Typography } from "antd";
import { useTheme } from "../design/ThemeProvider";
import { mixColors } from "../design/themes";
import { cn } from "./utils";

const TONE_CLASSES = {
  neutral: "bg-surface-sunken text-muted",
  primary: "bg-primary-soft text-primary-ink",
  secondary: "bg-secondary-soft text-secondary-ink",
  success: "bg-success-soft text-success-ink",
  warning: "bg-warning-soft text-warning-ink",
  danger: "bg-danger-soft text-danger-ink",
  info: "bg-info-soft text-info-ink"
};

/**
 * Status pill.
 *
 * Use `tone` for the semantic set. Pass `color` (a hex from the CMS) when the
 * label is user-configured — the soft background is then blended against the
 * current theme's surface so it works in dark mode too.
 */
export function Badge({ children, tone = "neutral", color, icon, size = "md", className }) {
  const { colors, isDark } = useTheme();
  const usesCustomColor = Boolean(color);

  const customStyle = usesCustomColor
    ? {
        backgroundColor: mixColors(color, colors.surface, isDark ? 0.82 : 0.88),
        color: isDark ? mixColors(color, colors.text, 0.25) : color
      }
    : undefined;

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-sm font-semibold",
        size === "sm" ? "px-1.5 py-0.5 text-caption" : "px-2 py-1 text-caption",
        !usesCustomColor && (TONE_CLASSES[tone] || TONE_CLASSES.neutral),
        className,
      )}
      style={customStyle}
    >
      {icon ? <span className="shrink-0 leading-none">{icon}</span> : null}
      <span className="truncate">{children}</span>
    </span>
  );
}

/** Coloured dot + label, for legends and dense list rows. */
export function DotLabel({ color, children, className }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <Typography.Text className="!truncate !text-small !text-ink">{children}</Typography.Text>
    </span>
  );
}
