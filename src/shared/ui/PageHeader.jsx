import { Typography } from "antd";
import { cn } from "./utils";

/**
 * Page title block. On desktop the actions sit inline; on mobile they wrap to
 * their own full-width row so buttons stay thumb-sized.
 */
export function PageHeader({ eyebrow, title, description, actions, tabs, className }) {
  return (
    <div className={cn("mb-4", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? <span className="ds-eyebrow">{eyebrow}</span> : null}
          <Typography.Title
            level={1}
            className="!mb-0 !mt-0.5 !text-[20px] !font-bold !leading-tight !text-ink md:!text-[24px]"
          >
            {title}
          </Typography.Title>
          {description ? (
            <Typography.Text className="!mt-1 !block !text-[13px] !leading-5 !text-muted">
              {description}
            </Typography.Text>
          ) : null}
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>

      {tabs ? <div className="mt-4">{tabs}</div> : null}
    </div>
  );
}

/**
 * Sticky bar that appears above the fold on desktop for save/cancel style
 * actions, so a long form never requires scrolling to the bottom to submit.
 */
export function StickyActionBar({ children, className }) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 -mx-3 mt-4 flex items-center justify-end gap-2 border-t border-line bg-surface/95 px-3 py-3 backdrop-blur md:-mx-5 md:px-5",
        className,
      )}
    >
      {children}
    </div>
  );
}
