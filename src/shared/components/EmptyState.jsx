import { Card, Empty, Space, Typography } from "antd";

export function EmptyState({ title, description, action }) {
  return (
    <Card className="finance-card finance-soft-card text-center">
      <Space orientation="vertical" size={10} className="w-full">
        <Empty description={false} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        <Typography.Title level={4} className="!m-0 !text-base">
          {title}
        </Typography.Title>
        <Typography.Paragraph className="!m-0 !text-sm !leading-6 !text-muted">
          {description}
        </Typography.Paragraph>
        {action ? <div className="pt-2">{action}</div> : null}
      </Space>
    </Card>
  );
}
