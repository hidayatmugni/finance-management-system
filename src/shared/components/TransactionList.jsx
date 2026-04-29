import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { Card, Empty, Pagination, Space, Typography } from "antd";
import { formatCurrency, formatDate } from "../utils/format";
import { themePalette } from "../config/themePalette";

export function TransactionList({ items, pageSize = 6, minHeight = 360 }) {
  const [page, setPage] = useState(1);
  const effectivePageSize = useMemo(() => {
    const estimatedRowHeight = 64;
    return Math.max(1, Math.floor(minHeight / estimatedRowHeight));
  }, [minHeight]);

  useEffect(() => {
    setPage(1);
  }, [items, effectivePageSize, pageSize]);

  const sortedItems = useMemo(
    () =>
      [...items].sort((firstItem, secondItem) => {
        const firstDate = getDateTime(firstItem.date);
        const secondDate = getDateTime(secondItem.date);
        return secondDate - firstDate;
      }),
    [items],
  );

  const pagedItems = useMemo(() => {
    const currentPageSize = Math.min(pageSize, effectivePageSize);
    const startIndex = (page - 1) * currentPageSize;
    return sortedItems.slice(startIndex, startIndex + currentPageSize);
  }, [effectivePageSize, page, pageSize, sortedItems]);

  const finalPageSize = Math.min(pageSize, effectivePageSize);

  const avatarColors = [
    "#47d371", // kuning
    "#e76b58", // merah soft
    "#a7e6e2", // cyan
    "#b4e943", // lime
    "#7c45e2", // ungu
    "#e4a040"  // orange
  ];

  function getAvatarColor(seed) {
    if (!seed) return avatarColors[0];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return avatarColors[Math.abs(hash) % avatarColors.length];
  }
  return (
    <Card className="finance-card">
      {sortedItems.length ? (
        <>
          <div style={{ minHeight }}>
            <Space orientation="vertical" size={10} className="w-full">
              {pagedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex w-full items-center justify-between gap-3 rounded-[16px] border border-line bg-[#252830] px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold"
                      style={{
                        background: getAvatarColor(item.memberName || item.title),
                        color: "#151515"
                      }}
                    >
                      {getInitials(item.memberName || item.title)}
                    </div>
                    <div className="min-w-0">
                      <Typography.Text strong className="block !text-[12px] !font-semibold !text-ink">
                        {truncateText(item.categoryName, 28)}
                      </Typography.Text>
                      <Typography.Text className="mt-0.5 block !text-[10px] !text-muted">
                        {truncateText(item.note || "-", 35)} |  {formatDate(item.date)}
                      </Typography.Text>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="flex items-center justify-end gap-1.5">
                      <span
                        className="flex items-center justify-center"
                        style={{
                          color:
                            item.type === "income"
                              ? themePalette.colors.success
                              : themePalette.colors.expense
                        }}
                      >
                        {item.type === "income" ? <ArrowDownOutlined className="text-[10px]" /> : <ArrowUpOutlined className="text-[10px]" />}
                      </span>
                      <Typography.Text className="!text-[11px] !font-semibold !text-ink">
                        {formatCurrency(item.amount)}
                      </Typography.Text>
                    </span>
                    <Typography.Text className="mt-0.5 block !text-[10px] !text-muted">
                      {item.type === "income" ? "Pemasukan" : "Pengeluaran"}
                    </Typography.Text>
                  </div>
                </div>
              ))}
            </Space>
          </div>

          {sortedItems.length > finalPageSize ? (
            <div className="mt-3 flex justify-end">
              <Pagination
                current={page}
                pageSize={finalPageSize}
                total={sortedItems.length}
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

function getDateTime(value) {
  if (!value) return 0;
  const parsedDate = Date.parse(value);
  return Number.isNaN(parsedDate) ? 0 : parsedDate;
}

function getInitials(value) {
  if (!value) return "TR";
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "TR";
}
