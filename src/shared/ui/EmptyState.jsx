import { InboxOutlined } from "@ant-design/icons";
import { Typography } from "antd";
import { cn } from "./utils";

/**
 * Empty states always explain *why* the area is empty and offer the next
 * action, so a new user is never left guessing.
 */
export function EmptyState({
  icon = <InboxOutlined />,
  title,
  description,
  action,
  secondaryAction,
  compact = false,
  className
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "px-4 py-8" : "px-6 py-14",
        className,
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full bg-primary-soft text-primary-ink",
          compact ? "h-11 w-11 text-[20px]" : "h-14 w-14 text-[24px]",
        )}
      >
        {icon}
      </span>

      <Typography.Text className="!mt-4 !block !text-[15px] !font-semibold !text-ink">
        {title}
      </Typography.Text>

      {description ? (
        <Typography.Text className="!mt-1.5 !block !max-w-md !text-[13px] !leading-6 !text-muted">
          {description}
        </Typography.Text>
      ) : null}

      {(action || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
