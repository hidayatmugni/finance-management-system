import { Card, Progress, Space, Typography } from "antd";
import { formatCompactCurrency } from "../utils/format";

export function SimpleBarList({ items, colorClass = "bg-primary" }) {
  const maxValue = Math.max(...items.map((item) => item.value || item.expense || 0), 1);
  const progressColor = colorClass.includes("expense")
    ? "#cf4b4b"
    : colorClass.includes("income")
      ? "#2f8f57"
      : "#8a3345";

  return (
    <Card className="finance-card">
      <Space orientation="vertical" size={16} className="w-full">
      {items.map((item) => {
        const value = item.value || item.expense || 0;
        const percent = Math.max(4, Math.round((value / maxValue) * 100));

        return (
          <div key={item.name}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <Typography.Text strong className="!text-sm">
                {item.name}
              </Typography.Text>
              <Typography.Text className="!text-xs !font-semibold !text-muted">
                {formatCompactCurrency(value)}
              </Typography.Text>
            </div>
            <Progress percent={percent} showInfo={false} strokeColor={progressColor} railColor="#1b2532" />
          </div>
        );
      })}
      </Space>
    </Card>
  );
}
