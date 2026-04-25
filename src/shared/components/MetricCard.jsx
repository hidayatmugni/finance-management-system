import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  WalletOutlined
} from "@ant-design/icons";
import { Card, Space, Typography } from "antd";
import { formatCurrency } from "../utils/format";
import { themePalette } from "../config/themePalette";

const toneConfig = {
  default: {
    bg: "#2e2e2e",
    text: "#ebe7e7",
    subtext: "rgba(0,0,0,.62)",
    icon: <BankOutlined />
  },
  income: {
    bg: "#9ac5a0",
    text: "#151515",
    subtext: "rgba(0,0,0,.62)",
    icon: <ArrowDownOutlined />
  },
  expense: {
    bg: "#ca837a",
    text: "#151515",
    subtext: "rgba(0,0,0,.62)",
    icon: <ArrowUpOutlined />
  },
  savings: {
    bg: "#a9bbeb",
    text: "#151515",
    subtext: "rgba(0,0,0,.62)",
    icon: <SafetyCertificateOutlined />
  },
  margin: {
    bg: "#86cdce",
    text: "#151515",
    subtext: "rgba(0,0,0,.62)",
    icon: <WalletOutlined />
  },
  warning: {
    bg: "#d4cd86",
    text: "#151515",
    subtext: "rgba(0,0,0,.62)",
    icon: <WalletOutlined />
  }
};

export function MetricCard({ label, value, tone = "default", helper }) {
  const config = toneConfig[tone] || toneConfig.default;

  return (
    <Card
      variant="borderless"
      className="!overflow-hidden !rounded-[14px] !border-0"
      styles={{
        body: {
          minHeight: 80,
          padding: 13,
          background: config.bg,
          boxShadow: "none"
        }
      }}
    >
      <div className="flex h-full flex-col justify-between gap-5">
        <div className="flex items-start justify-between gap-3">
          <Space orientation="vertical" size={4} className="min-w-0">
            <Typography.Text
              className="!text-[14px] !font-semibold !leading-none"
              style={{ color: config.text }}
            >
              {label}
            </Typography.Text>

            <Typography.Text
              className="!block !text-[14px] !font-semibold !leading-tight"
              style={{
                color: config.text,
                wordBreak: "normal",
                overflowWrap: "normal"
              }}
            >
              {formatCurrency(value)}
            </Typography.Text>

            {helper ? (
              <Typography.Text
                className="!text-[11px] !leading-4"
                style={{ color: config.subtext }}
              >
                {helper}
              </Typography.Text>
            ) : null}
          </Space>

          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[20px]"
            style={{
              color: config.text,
              background: "rgba(245, 245, 245, 0)"
            }}
          >
            {config.icon}
          </span>
        </div>
      </div>
    </Card>
  );
}