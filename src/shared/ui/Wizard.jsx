import { CheckOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import { Button, Typography } from "antd";
import { useState } from "react";
import { cn } from "./utils";

/**
 * Multi-step flow for the few processes that genuinely need one (onboarding,
 * bulk setup). Each step validates before advancing so errors surface early
 * instead of at the very end.
 *
 * @param {{key: string, title: string, description?: string, content: React.ReactNode, validate?: () => boolean|Promise<boolean>}[]} steps
 */
export function Wizard({ steps = [], onFinish, finishLabel = "Selesai", submitting = false }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [checking, setChecking] = useState(false);

  const step = steps[activeIndex];
  const isLast = activeIndex === steps.length - 1;

  const goNext = async () => {
    setChecking(true);
    try {
      const valid = step.validate ? await step.validate() : true;
      if (!valid) return;

      if (isLast) {
        await onFinish?.();
      } else {
        setActiveIndex((index) => index + 1);
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div>
      {/* Progress rail — numbers on desktop, a compact bar on mobile. */}
      <ol className="mb-5 hidden items-center gap-2 sm:flex">
        {steps.map((item, index) => {
          const isDone = index < activeIndex;
          const isActive = index === activeIndex;

          return (
            <li key={item.key} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold transition",
                  isDone && "bg-success text-white",
                  isActive && "bg-primary text-white",
                  !isDone && !isActive && "bg-surface-sunken text-muted",
                )}
              >
                {isDone ? <CheckOutlined /> : index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <Typography.Text
                  className={cn(
                    "!block !truncate !text-[12px] !font-medium",
                    isActive ? "!text-ink" : "!text-muted",
                  )}
                >
                  {item.title}
                </Typography.Text>
              </span>
              {index < steps.length - 1 ? (
                <span
                  className={cn("h-px flex-1", isDone ? "bg-success" : "bg-line")}
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="mb-4 sm:hidden">
        <div className="mb-2 flex items-baseline justify-between">
          <Typography.Text className="!text-[13px] !font-semibold !text-ink">
            {step.title}
          </Typography.Text>
          <Typography.Text className="!text-[12px] !text-muted">
            {activeIndex + 1}/{steps.length}
          </Typography.Text>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-surface-sunken">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${((activeIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {step.description ? (
        <Typography.Text className="!mb-4 !block !text-[13px] !text-muted">
          {step.description}
        </Typography.Text>
      ) : null}

      <div className="animate-fade-in">{step.content}</div>

      <div className="mt-6 flex items-center justify-between gap-2">
        <Button
          icon={<LeftOutlined />}
          onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
          disabled={activeIndex === 0 || submitting}
        >
          Kembali
        </Button>
        <Button
          type="primary"
          loading={checking || submitting}
          onClick={goNext}
          icon={isLast ? <CheckOutlined /> : <RightOutlined />}
          iconPosition="end"
        >
          {isLast ? finishLabel : "Lanjut"}
        </Button>
      </div>
    </div>
  );
}
