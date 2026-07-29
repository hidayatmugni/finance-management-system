import { CheckCircleFilled, ExclamationCircleFilled } from "@ant-design/icons";
import { Typography } from "antd";
import { cn } from "./utils";

/**
 * Label + control + validation wrapper shared by every input in the app.
 *
 * Validation is rendered inline and reserves no vertical space until it is
 * needed, so forms don't jump while the user types.
 */
export function Field({
  label,
  htmlFor,
  required = false,
  optional = false,
  hint,
  error,
  success,
  children,
  className,
  labelExtra
}) {
  return (
    <div className={cn("min-w-0", className)}>
      {label ? (
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <label
            htmlFor={htmlFor}
            className="text-[13px] font-medium text-ink"
          >
            {label}
            {required ? <span className="ml-0.5 text-danger-ink">*</span> : null}
            {optional ? <span className="ml-1.5 text-[11px] font-normal text-subtle">opsional</span> : null}
          </label>
          {labelExtra}
        </div>
      ) : null}

      {children}

      {error ? (
        <Typography.Text className="!mt-1 !flex !items-center !gap-1 !text-[12px] !text-danger-ink">
          <ExclamationCircleFilled className="text-[11px]" />
          {error}
        </Typography.Text>
      ) : success ? (
        <Typography.Text className="!mt-1 !flex !items-center !gap-1 !text-[12px] !text-success-ink">
          <CheckCircleFilled className="text-[11px]" />
          {success}
        </Typography.Text>
      ) : hint ? (
        <Typography.Text className="!mt-1 !block !text-[12px] !text-muted">{hint}</Typography.Text>
      ) : null}
    </div>
  );
}
