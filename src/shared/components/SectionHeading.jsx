import { Space, Typography } from "antd";

export function SectionHeading({ eyebrow, title, action }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <Space orientation="vertical" size={2}>
        {eyebrow ? (
          <Typography.Text className="text-[16px] font-medium uppercase tracking-[0.12em] text-muted">
            {eyebrow}
          </Typography.Text>
        ) : null}
        <Typography.Title level={3} className="!m-0 !text-[0.9rem] !font-bold !tracking-tight">
          {title}
        </Typography.Title>
      </Space>
      {action}
    </div>
  );
}
