import { SearchOutlined } from "@ant-design/icons";
import { Input, Modal, Typography } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { renderIcon } from "../../shared/config/iconRegistry";
import { formatCombo } from "../../shared/hooks/useHotkeys";
import { cn } from "../../shared/ui/utils";

/**
 * Ctrl/Cmd+K launcher.
 *
 * Every navigation item and quick action from the CMS is reachable in two
 * keystrokes, which is the fastest path on desktop and removes the need to hunt
 * through the sidebar.
 */
export function CommandPalette({ open, onClose, navItems = [], quickActions = [] }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [queryText, setQueryText] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const commands = useMemo(() => {
    const items = [
      ...navItems.map((item) => ({
        key: `nav-${item.id}`,
        label: item.label,
        group: "Halaman",
        icon: item.icon,
        path: item.path
      })),
      ...quickActions.map((item) => ({
        key: `action-${item.id}`,
        label: item.label,
        group: "Aksi cepat",
        icon: item.icon,
        path: item.path
      }))
    ];

    const keyword = queryText.trim().toLowerCase();
    if (!keyword) return items;

    return items.filter((item) => item.label.toLowerCase().includes(keyword));
  }, [navItems, quickActions, queryText]);

  useEffect(() => {
    if (open) {
      setQueryText("");
      setActiveIndex(0);
      // Focus after the modal's own transition, otherwise it steals it back.
      window.setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [queryText]);

  const run = (command) => {
    onClose();
    navigate(command.path);
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, commands.length - 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    }
    if (event.key === "Enter" && commands[activeIndex]) {
      event.preventDefault();
      run(commands[activeIndex]);
    }
  };

  let lastGroup = null;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={560}
      styles={{ body: { padding: 0 } }}
      style={{ top: 96 }}
      destroyOnHidden
    >
      <div className="border-b border-line px-3 py-2">
        <Input
          ref={inputRef}
          value={queryText}
          onChange={(event) => setQueryText(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Cari halaman atau aksi…"
          variant="borderless"
          prefix={<SearchOutlined className="text-subtle" />}
          suffix={
            <span className="rounded-xs border border-line px-1.5 py-0.5 text-caption text-subtle">
              Esc
            </span>
          }
        />
      </div>

      <div className="max-h-[52vh] overflow-y-auto p-2">
        {commands.length === 0 ? (
          <div className="px-3 py-8 text-center text-small text-muted">Tidak ada hasil</div>
        ) : (
          commands.map((command, index) => {
            const showGroup = command.group !== lastGroup;
            lastGroup = command.group;

            return (
              <div key={command.key}>
                {showGroup ? (
                  <Typography.Text className="!mb-1 !mt-2 !block !px-2 !text-caption !font-semibold !uppercase !text-subtle">
                    {command.group}
                  </Typography.Text>
                ) : null}
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => run(command)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition",
                    index === activeIndex ? "bg-primary-soft text-primary-ink" : "text-ink",
                  )}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-surface-sunken text-small">
                    {renderIcon(command.icon)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-body">{command.label}</span>
                  {index === activeIndex ? (
                    <span className="shrink-0 text-caption text-subtle">
                      {formatCombo("enter")}
                    </span>
                  ) : null}
                </button>
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
}
