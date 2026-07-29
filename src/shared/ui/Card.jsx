import { Typography } from "antd";
import { cn } from "./utils";

/**
 * Surface primitive. Every panel in the app is one of these — no ad-hoc
 * background/border/shadow combinations elsewhere.
 */
export function Card({
  children,
  className,
  padding = "md",
  interactive = false,
  as: Component = "div",
  ...rest
}) {
  const paddings = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-5 md:p-6"
  };

  return (
    <Component
      className={cn("ds-card", paddings[padding], interactive && "ds-card-interactive", className)}
      {...rest}
    >
      {children}
    </Component>
  );
}

/**
 * Card with a titled header row and an optional action slot on the right.
 * `bodyClassName` lets callers drop the padding for edge-to-edge tables.
 */
export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  icon
}) {
  return (
    <Card className={cn("overflow-hidden", className)} padding="none">
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex min-w-0 items-start gap-3">
            {icon ? (
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-ink">
                {icon}
              </span>
            ) : null}
            <div className="min-w-0">
              <Typography.Text className="!block !text-[15px] !font-semibold !text-ink">
                {title}
              </Typography.Text>
              {description ? (
                <Typography.Text className="!mt-0.5 !block !text-[12px] !text-muted">
                  {description}
                </Typography.Text>
              ) : null}
            </div>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </Card>
  );
}
