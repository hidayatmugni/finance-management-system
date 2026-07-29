import { DownOutlined, HolderOutlined, UpOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useState } from "react";
import { cn } from "./utils";

/**
 * Reorderable list.
 *
 * Uses the native HTML5 drag API on pointer devices and exposes up/down buttons
 * for touch and keyboard users — dragging is a convenience, never the only way
 * to reorder. No extra dependency, which keeps the bundle down.
 *
 * @param {object} props
 * @param {any[]} props.items
 * @param {(item: any) => string} props.getKey
 * @param {(nextItems: any[]) => void} props.onReorder
 * @param {(item: any, index: number) => React.ReactNode} props.renderItem
 */
export function SortableList({ items = [], getKey, onReorder, renderItem, className, disabled }) {
  const [draggingKey, setDraggingKey] = useState(null);
  const [overKey, setOverKey] = useState(null);

  const move = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) return;
    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onReorder(next);
  };

  const handleDrop = (targetIndex) => {
    const fromIndex = items.findIndex((item) => getKey(item) === draggingKey);
    setDraggingKey(null);
    setOverKey(null);
    move(fromIndex, targetIndex);
  };

  return (
    <ul className={cn("space-y-2", className)}>
      {items.map((item, index) => {
        const key = getKey(item);
        const isDragging = draggingKey === key;
        const isOver = overKey === key && !isDragging;

        return (
          <li
            key={key}
            draggable={!disabled}
            onDragStart={() => setDraggingKey(key)}
            onDragEnd={() => {
              setDraggingKey(null);
              setOverKey(null);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setOverKey(key);
            }}
            onDrop={(event) => {
              event.preventDefault();
              handleDrop(index);
            }}
            className={cn(
              "flex items-center gap-2 rounded-md border bg-surface px-3 py-2.5 transition",
              isDragging ? "border-primary opacity-50" : "border-line",
              isOver && "border-primary ring-1 ring-primary/30",
            )}
          >
            {!disabled ? (
              <span className="cursor-grab text-subtle active:cursor-grabbing" aria-hidden>
                <HolderOutlined />
              </span>
            ) : null}

            <div className="min-w-0 flex-1">{renderItem(item, index)}</div>

            {!disabled ? (
              <span className="flex shrink-0 flex-col">
                <Button
                  type="text"
                  size="small"
                  icon={<UpOutlined />}
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                  aria-label="Naikkan"
                />
                <Button
                  type="text"
                  size="small"
                  icon={<DownOutlined />}
                  disabled={index === items.length - 1}
                  onClick={() => move(index, index + 1)}
                  aria-label="Turunkan"
                />
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
