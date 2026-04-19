import { Card, Space, Statistic, Typography } from "antd";
import { formatCurrency } from "../utils/format";

export function MetricCard({ label, value, tone = "default", helper }) {
  const toneColorMap = {
    default: "#dbdbdb",
    income: "#41ca7a",
    expense: "#ca4242",
    savings: "#4da3ff",
    warning: "#d7a237"
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
              fontSize: "1.15rem",
              fontWeight: 800,
              lineHeight: 1.3
            }
          }}
        />
        {helper ? <Typography.Text className="text-xs text-muted">{helper}</Typography.Text> : null}
      </Space>
    </Card>
  );
}
