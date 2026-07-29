import { CloseOutlined, FilterOutlined, SearchOutlined } from "@ant-design/icons";
import { Badge, Button, Drawer, Input } from "antd";
import { useState } from "react";
import { useResponsive } from "../hooks/useResponsive";
import { Card } from "./Card";
import { cn } from "./utils";

/**
 * Search + filter controls for list pages.
 *
 * Desktop keeps everything visible in one row (filters are cheap to reach).
 * Mobile shows only search plus a filter button with an active-count badge,
 * opening the controls in a sheet — screen space goes to the data instead.
 */
export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Cari…",
  activeCount = 0,
  onReset,
  children,
  actions,
  className
}) {
  const { isMobile } = useResponsive();
  const [sheetOpen, setSheetOpen] = useState(false);

  const searchInput = (
    <Input
      allowClear
      value={search}
      onChange={(event) => onSearchChange?.(event.target.value)}
      placeholder={searchPlaceholder}
      prefix={<SearchOutlined className="text-subtle" />}
      className="!w-full"
    />
  );

  if (isMobile) {
    return (
      <>
        <div className={cn("flex items-center gap-2", className)}>
          <div className="min-w-0 flex-1">{searchInput}</div>
          {children ? (
            <Badge count={activeCount} size="small" offset={[-2, 2]}>
              <Button icon={<FilterOutlined />} onClick={() => setSheetOpen(true)} aria-label="Filter" />
            </Badge>
          ) : null}
          {actions}
        </div>

        <Drawer
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title="Filter"
          placement="bottom"
          height="auto"
          styles={{
            content: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
            body: { maxHeight: "70vh" }
          }}
          footer={
            <div className="safe-bottom flex items-center gap-2">
              <Button
                block
                onClick={() => {
                  onReset?.();
                  setSheetOpen(false);
                }}
                disabled={activeCount === 0}
              >
                Reset
              </Button>
              <Button block type="primary" onClick={() => setSheetOpen(false)}>
                Terapkan
              </Button>
            </div>
          }
        >
          <div className="space-y-4">{children}</div>
        </Drawer>
      </>
    );
  }

  return (
    <Card className={className} padding="none">
      <div className="flex flex-wrap items-end gap-3 p-3">
        <div className="min-w-[220px] flex-1">{searchInput}</div>
        {children}
        <div className="flex items-center gap-2">
          {activeCount > 0 ? (
            <Button icon={<CloseOutlined />} onClick={onReset}>
              Reset ({activeCount})
            </Button>
          ) : null}
          {actions}
        </div>
      </div>
    </Card>
  );
}
