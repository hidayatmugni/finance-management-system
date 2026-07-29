import { Button, Pagination, Table, Typography } from "antd";
import { useMemo, useState } from "react";
import { useResponsive } from "../hooks/useResponsive";
import { Card } from "./Card";
import { EmptyState } from "./EmptyState";
import { SkeletonTable } from "./Skeleton";
import { cn } from "./utils";

/**
 * The single table component for the whole app.
 *
 * Desktop renders a real Ant table (sortable, sticky header, row selection,
 * horizontal scroll contained inside the card). Mobile renders the same data as
 * a tap-friendly card list via `renderMobileCard`, because a 7-column table on
 * a phone is unusable. Both share one data source, one pagination state and one
 * selection state, so bulk actions behave identically on either device.
 *
 * @param {object} props
 * @param {any[]} props.dataSource
 * @param {import('antd').TableProps['columns']} props.columns
 * @param {(record: any) => React.ReactNode} [props.renderMobileCard]
 * @param {{selectedKeys: string[], onChange: (keys: string[]) => void, actions: React.ReactNode}} [props.selection]
 */
export function DataTable({
  dataSource = [],
  columns = [],
  rowKey = "id",
  loading = false,
  renderMobileCard,
  selection,
  emptyState,
  pageSize: initialPageSize = 25,
  showPagination = true,
  onRowClick,
  size = "middle",
  scrollX,
  className,
  footer
}) {
  const { isMobile } = useResponsive();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const total = dataSource.length;
  const currentPage = Math.min(page, Math.max(1, Math.ceil(total / pageSize)));

  const pagedData = useMemo(() => {
    if (!showPagination) return dataSource;
    const start = (currentPage - 1) * pageSize;
    return dataSource.slice(start, start + pageSize);
  }, [dataSource, currentPage, pageSize, showPagination]);

  const getKey = (record) => (typeof rowKey === "function" ? rowKey(record) : record[rowKey]);

  if (loading) {
    return <SkeletonTable rows={6} />;
  }

  if (total === 0) {
    return <Card padding="none">{emptyState || <EmptyState title="Belum ada data" />}</Card>;
  }

  const selectionBar =
    selection && selection.selectedKeys.length > 0 ? (
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary-border bg-primary-soft px-4 py-2.5">
        <Typography.Text className="!text-[13px] !font-semibold !text-primary-ink">
          {selection.selectedKeys.length} dipilih
        </Typography.Text>
        <div className="flex flex-wrap items-center gap-2">
          {selection.actions}
          <Button size="small" type="text" onClick={() => selection.onChange([])}>
            Batal
          </Button>
        </div>
      </div>
    ) : null;

  if (isMobile && renderMobileCard) {
    const allVisibleSelected =
      selection && pagedData.length > 0 && pagedData.every((item) => selection.selectedKeys.includes(getKey(item)));

    return (
      <div className={cn("space-y-3", className)}>
        {selectionBar ? <Card padding="none">{selectionBar}</Card> : null}

        {selection ? (
          <button
            type="button"
            className="text-[12px] font-medium text-primary-ink"
            onClick={() =>
              selection.onChange(allVisibleSelected ? [] : pagedData.map((item) => getKey(item)))
            }
          >
            {allVisibleSelected ? "Batalkan pilihan" : "Pilih semua di halaman ini"}
          </button>
        ) : null}

        <div className="space-y-2.5">
          {pagedData.map((record) => {
            const key = getKey(record);
            const isSelected = selection?.selectedKeys.includes(key);

            return (
              <div
                key={key}
                onClick={() => onRowClick?.(record)}
                className={cn(
                  "rounded-lg border bg-surface transition",
                  isSelected ? "border-primary ring-1 ring-primary/30" : "border-line",
                  onRowClick && "cursor-pointer active:scale-[0.995]",
                )}
              >
                {renderMobileCard(record, {
                  selected: isSelected,
                  toggleSelected: (event) => {
                    event?.stopPropagation();
                    if (!selection) return;
                    selection.onChange(
                      isSelected
                        ? selection.selectedKeys.filter((item) => item !== key)
                        : [...selection.selectedKeys, key],
                    );
                  }
                })}
              </div>
            );
          })}
        </div>

        {showPagination && total > pageSize ? (
          <div className="flex justify-center pt-1">
            <Pagination
              simple
              current={currentPage}
              pageSize={pageSize}
              total={total}
              onChange={setPage}
            />
          </div>
        ) : null}

        {footer}
      </div>
    );
  }

  return (
    <Card padding="none" className={cn("overflow-hidden", className)}>
      {selectionBar}
      <div className="ds-scroll-x">
        <Table
          dataSource={pagedData}
          columns={columns}
          rowKey={rowKey}
          size={size}
          pagination={false}
          sticky
          scroll={scrollX ? { x: scrollX } : undefined}
          rowSelection={
            selection
              ? {
                  selectedRowKeys: selection.selectedKeys,
                  onChange: selection.onChange,
                  columnWidth: 44
                }
              : undefined
          }
          onRow={(record) => ({
            onClick: onRowClick ? () => onRowClick(record) : undefined,
            style: onRowClick ? { cursor: "pointer" } : undefined
          })}
        />
      </div>

      {showPagination && total > pageSize ? (
        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
          <Typography.Text className="!text-[12px] !text-muted">
            {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, total)} dari {total}
          </Typography.Text>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            showSizeChanger
            pageSizeOptions={[10, 25, 50, 100]}
            size="small"
            onChange={(nextPage, nextSize) => {
              setPage(nextPage);
              setPageSize(nextSize);
            }}
          />
        </div>
      ) : null}

      {footer}
    </Card>
  );
}
