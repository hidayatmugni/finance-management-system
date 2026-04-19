import { Card, Space, Typography } from "antd";

export function InsightCard({ title, description }) {
  return (
    <Card className="finance-card finance-soft-card">
      <Space orientation="vertical" size={8}>
        <Typography.Text className="metric-label">{title}</Typography.Text>
        <Typography.Text className="!text-base !font-semibold !leading-6 !text-ink">
          {description}
        </Typography.Text>
      </Space>
    </Card>
  );
}
