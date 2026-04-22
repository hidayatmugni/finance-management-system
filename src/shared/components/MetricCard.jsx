import { Card, Space, Statistic, Typography } from "antd";
import { formatCurrency } from "../utils/format";

export function MetricCard({ label, value, tone = "default", helper }) {
  const toneColorMap = {
    default: "#f1f5f9",
    income: "#19c06c",
    expense: "#f04452",
    savings: "#2f8fff",
    warning: "#f5b546"
  };

  return (
    <Card className="finance-card finance-soft-card" variant="outlined">
      <Space orientation="vertical" size={4} className="w-full">
        <Typography.Text className="metric-label">{label}</Typography.Text>
        <Statistic
          value={formatCurrency(value)}
          styles={{
            content: {
              color: toneColorMap[tone],
              fontSize: "1rem",
              fontWeight: 700,
              lineHeight: 1.2
            }
          }}
        />
        {helper ? <Typography.Text className="text-[11px] text-muted">{helper}</Typography.Text> : null}
      </Space>
    </Card>
  );
}
