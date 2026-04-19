import { Space, Typography } from "antd";

export function SectionHeading({ eyebrow, title, action }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <Space orientation="vertical" size={2}>
        {eyebrow ? (
          <Typography.Text className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
            {eyebrow}
          </Typography.Text>
        ) : null}
        <Typography.Title level={3} className="!m-0 !text-[1.2rem] !font-extrabold !tracking-tight">
          {title}
        </Typography.Title>
      </Space>
      {action}
    </div>
  );
}
