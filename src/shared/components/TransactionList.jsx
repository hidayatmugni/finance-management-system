import { Card, Space, Tag, Typography } from "antd";
import { formatCurrency, formatDate } from "../utils/format";

export function TransactionList({ items }) {
  return (
    <Card className="finance-card">
      <Space orientation="vertical" size={12} className="w-full">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`flex w-full items-start justify-between gap-3 pb-3 ${
              index === items.length - 1 ? "" : "border-b border-line"
            }`}
          >
            <div className="min-w-0">
              <Typography.Text strong className="block !text-sm">
                {truncateText(item.title, 34)}
              </Typography.Text>
              <Typography.Text className="mt-1 block !text-xs !text-muted">
                {item.memberName} | {item.categoryName} | {formatDate(item.date)}
              </Typography.Text>
              <Tag className="mt-2 rounded-full border-0 bg-white/10 px-2 py-[2px] text-[10px] font-semibold text-muted">
                {translateSyncStatus(item.syncStatus)}
              </Tag>
            </div>
            <Typography.Text
              strong
              className={item.type === "income" ? "!text-income" : "!text-expense"}
            >
              {item.type === "income" ? "+" : "-"}
              {formatCurrency(item.amount)}
            </Typography.Text>
          </div>
        ))}
      </Space>
    </Card>
  );
}

function truncateText(value, maxLength) {
  if (!value) return "-";
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function translateSyncStatus(syncStatus) {
  switch (syncStatus) {
    case "pending":
      return "Menunggu sinkronisasi";
    case "synced":
      return "Tersinkron";
    case "failed":
      return "Gagal sinkron";
    default:
      return syncStatus;
  }
}
