import { Card, Progress, Space, Typography } from "antd";
import { formatCompactCurrency } from "../utils/format";

export function SimpleBarList({ items, colorClass = "bg-primary" }) {
  const maxValue = Math.max(...items.map((item) => item.value || item.expense || 0), 1);
  const progressColor = colorClass.includes("expense")
    ? "#f04452"
    : colorClass.includes("income")
      ? "#19c06c"
      : "#16b364";
  const valueTextClass = colorClass.includes("expense")
    ? "!text-expense"
    : colorClass.includes("income")
      ? "!text-income"
      : "!text-primary";

  return (
    <Card className="finance-card">
      <Space orientation="vertical" size={10} className="w-full">
      {items.map((item) => {
        const value = item.value || item.expense || 0;
        const percent = Math.max(4, Math.round((value / maxValue) * 100));

        return (
          <div key={item.name} className="rounded-[12px] border border-line bg-panel px-3 py-2.5">
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <Typography.Text strong className="!text-[13px] !font-semibold !text-ink">
                {item.name}
              </Typography.Text>
              <Typography.Text className={`!text-[11px] !font-semibold ${valueTextClass}`}>
                {formatCompactCurrency(value)}
              </Typography.Text>
            </div>
            <Progress percent={percent} showInfo={false} strokeColor={progressColor} railColor="#242426" size={[0, 8]} />
          </div>
        );
      })}
      </Space>
    </Card>
  );
}
