import { InputNumber, Typography } from "antd";
import { forwardRef, useMemo } from "react";
import { cn } from "./utils";

/**
 * Currency input tuned for fast entry:
 * - thousands separators appear while typing, no manual formatting;
 * - "k"/"jt" suffixes are understood (`25k` -> 25.000, `1,5jt` -> 1.500.000);
 * - optional quick-amount chips remove typing altogether for common values.
 */
export const MoneyField = forwardRef(function MoneyField(
  {
    value,
    onChange,
    currencySymbol = "Rp",
    quickAmounts = [],
    locale = "id-ID",
    size = "large",
    status,
    placeholder = "0",
    autoFocus,
    onPressEnter,
    className,
    id
  },
  ref,
) {
  const groupSeparator = useMemo(() => {
    const parts = new Intl.NumberFormat(locale).formatToParts(1234.5);
    return parts.find((part) => part.type === "group")?.value || ".";
  }, [locale]);

  const decimalSeparator = useMemo(() => {
    const parts = new Intl.NumberFormat(locale).formatToParts(1234.5);
    return parts.find((part) => part.type === "decimal")?.value || ",";
  }, [locale]);

  const formatter = (raw) => {
    if (raw === "" || raw === null || raw === undefined) return "";
    const numeric = Number(String(raw).replace(/[^\d.-]/g, ""));
    if (!Number.isFinite(numeric)) return "";
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(numeric);
  };

  const parser = (raw) => {
    if (!raw) return "";

    const cleaned = String(raw).trim().toLowerCase();
    // Shorthand: 25k / 25rb / 1,5jt / 2m
    const shorthand = cleaned.match(/^([\d.,]+)\s*(k|rb|ribu|jt|juta|m)$/);
    if (shorthand) {
      const base = Number(
        shorthand[1].split(groupSeparator).join("").replace(decimalSeparator, "."),
      );
      const multiplier = /^(k|rb|ribu)$/.test(shorthand[2]) ? 1_000 : 1_000_000;
      return Number.isFinite(base) ? String(Math.round(base * multiplier)) : "";
    }

    return cleaned.replace(new RegExp(`\\${groupSeparator}`, "g"), "").replace(/[^\d]/g, "");
  };

  return (
    <div className={cn("min-w-0", className)}>
      <InputNumber
        ref={ref}
        id={id}
        value={value === "" || value === null ? null : value}
        onChange={onChange}
        size={size}
        status={status}
        className="!w-full"
        min={0}
        controls={false}
        inputMode="numeric"
        autoFocus={autoFocus}
        placeholder={placeholder}
        prefix={<span className="pr-1 text-[13px] font-medium text-muted">{currencySymbol}</span>}
        formatter={formatter}
        parser={parser}
        onPressEnter={onPressEnter}
      />

      {quickAmounts.length > 0 ? (
        <div className="ds-scrollbar-hidden mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
          {quickAmounts.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => onChange?.(Number(value || 0) + amount)}
              className="shrink-0 rounded-sm border border-line bg-surface px-2.5 py-1 text-[12px] font-medium text-muted transition hover:border-primary hover:bg-primary-soft hover:text-primary-ink"
            >
              +{new Intl.NumberFormat(locale, { notation: "compact" }).format(amount)}
            </button>
          ))}
          {Number(value || 0) > 0 ? (
            <button
              type="button"
              onClick={() => onChange?.(null)}
              className="shrink-0 rounded-sm border border-line bg-surface px-2.5 py-1 text-[12px] font-medium text-muted transition hover:border-danger hover:text-danger-ink"
            >
              Reset
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});

/** Read-only, right-aligned currency display used inside tables and lists. */
export function Money({ value, type, className, locale = "id-ID", currency = "IDR" }) {
  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value || 0);

  const tone =
    type === "income" ? "text-success-ink" : type === "expense" ? "text-danger-ink" : "text-ink";
  const sign = type === "income" ? "+" : type === "expense" ? "−" : "";

  return (
    <Typography.Text className={cn("!font-semibold !tabular-nums", tone, className)}>
      {sign}
      {formatted}
    </Typography.Text>
  );
}
