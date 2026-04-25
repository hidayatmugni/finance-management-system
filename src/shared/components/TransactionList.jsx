import { useEffect, useMemo, useState } from "react";
import { Card, Empty, Pagination, Space, Typography } from "antd";
import { formatCurrency, formatDate } from "../utils/format";

export function TransactionList({ items, pageSize = 6, minHeight = 360 }) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [items, pageSize]);

  const pagedItems = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  }, [items, page, pageSize]);

  return (
    <Card className="finance-card">
      {items.length ? (
        <>
          <div style={{ minHeight }}>
            <Space orientation="vertical" size={8} className="w-full">
              {pagedItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex w-full items-start justify-between gap-3 pb-2 ${
                    index === pagedItems.length - 1 ? "" : "border-b border-line"
                  }`}
                >
                  <div className="min-w-0">
                    <Typography.Text strong className="block !text-[12px] !font-semibold">
                      {truncateText(item.title, 34)}
                    </Typography.Text>
                    <Typography.Text className="mt-0.5 block !text-[10px] !text-muted">
                      {item.memberName} | {item.categoryName} | {formatDate(item.date)}
                    </Typography.Text>
                  </div>
                  <Typography.Text
                    className={item.type === "income" ? "!text-[11px] !font-semibold !text-income" : "!text-[11px] !font-semibold !text-expense"}
                  >
                    {item.type === "income" ? "+" : "-"}
                    {formatCurrency(item.amount)}
                  </Typography.Text>
                </div>
              ))}
            </Space>
          </div>

          {items.length > pageSize ? (
            <div className="mt-3 flex justify-end">
              <Pagination
                current={page}
                pageSize={pageSize}
                total={items.length}
                size="small"
                showSizeChanger={false}
                onChange={setPage}
              />
            </div>
          ) : null}
        </>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<span className="text-[12px] text-muted">Belum ada transaksi pada periode ini.</span>}
        />
      )}
    </Card>
  );
}

function truncateText(value, maxLength) {
  if (!value) return "-";
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}
