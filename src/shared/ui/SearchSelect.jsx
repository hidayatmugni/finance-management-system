import { PlusOutlined } from "@ant-design/icons";
import { Select, Typography } from "antd";
import { forwardRef, useMemo, useState } from "react";
import { cn } from "./utils";

function normalise(value) {
  return String(value ?? "").toLowerCase();
}

/**
 * Searchable single-select.
 *
 * Everything is keyboard driven: type to filter, arrows to move, Enter to pick.
 * When `onCreate` is supplied, an unmatched search term offers to create the
 * option inline — the user never has to leave the form to add a category.
 *
 * @param {object} props
 * @param {{value: string, label: string, description?: string, color?: string, icon?: React.ReactNode, group?: string}[]} props.options
 * @param {(label: string) => Promise<string|void>|string|void} [props.onCreate]
 *   Receives the typed label; return the new option's value to select it.
 */
export const SearchSelect = forwardRef(function SearchSelect(
  {
    options = [],
    value,
    onChange,
    onCreate,
    createLabel = "Tambah",
    placeholder = "Pilih atau ketik untuk mencari",
    size = "large",
    status,
    allowClear = false,
    disabled = false,
    loading = false,
    className,
    id,
    autoFocus,
    popupMatchSelectWidth = true
  },
  ref,
) {
  const [searchText, setSearchText] = useState("");
  const [creating, setCreating] = useState(false);

  const grouped = useMemo(() => {
    const withGroups = options.some((option) => option.group);
    if (!withGroups) {
      return options.map(toAntdOption);
    }

    const buckets = new Map();
    options.forEach((option) => {
      const key = option.group || "Lainnya";
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(toAntdOption(option));
    });

    return [...buckets.entries()].map(([label, children]) => ({ label, options: children }));
  }, [options]);

  const hasExactMatch = options.some(
    (option) => normalise(option.label) === normalise(searchText.trim()),
  );
  const canCreate = Boolean(onCreate) && searchText.trim().length > 0 && !hasExactMatch;

  const handleCreate = async () => {
    const label = searchText.trim();
    if (!label) return;

    setCreating(true);
    try {
      const createdValue = await onCreate(label);
      if (createdValue) onChange?.(createdValue);
      setSearchText("");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Select
      ref={ref}
      id={id}
      className={cn("!w-full", className)}
      value={value || undefined}
      onChange={onChange}
      size={size}
      status={status}
      disabled={disabled}
      loading={loading || creating}
      allowClear={allowClear}
      autoFocus={autoFocus}
      showSearch
      searchValue={searchText}
      onSearch={setSearchText}
      onBlur={() => setSearchText("")}
      placeholder={placeholder}
      optionFilterProp="keywords"
      filterOption={(input, option) => normalise(option?.keywords).includes(normalise(input))}
      popupMatchSelectWidth={popupMatchSelectWidth}
      options={grouped}
      notFoundContent={
        canCreate ? null : (
          <div className="px-2 py-3 text-center text-[12px] text-muted">Tidak ada hasil</div>
        )
      }
      popupRender={
        canCreate
          ? (menu) => (
              <>
                {menu}
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={handleCreate}
                  className="flex w-full items-center gap-2 border-t border-line px-3 py-2.5 text-left text-[13px] font-medium text-primary-ink transition hover:bg-primary-soft"
                >
                  <PlusOutlined />
                  {createLabel} &ldquo;{searchText.trim()}&rdquo;
                </button>
              </>
            )
          : undefined
      }
    />
  );
});

/**
 * Rich options render a colour dot / icon / trailing description. `keywords`
 * always carries the plain text, because `filterOption` cannot search a node.
 */
function toAntdOption(option) {
  const isRich = Boolean(option.color || option.icon || option.description);

  return {
    value: option.value,
    title: option.description || option.label,
    keywords: [option.label, option.keywords, option.description].filter(Boolean).join(" "),
    label: isRich ? (
      <span className="flex items-center gap-2">
        {option.icon ? <span className="shrink-0 text-[13px]">{option.icon}</span> : null}
        {option.color ? (
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: option.color }}
            aria-hidden
          />
        ) : null}
        <span className="truncate">{option.label}</span>
        {option.description ? (
          <Typography.Text className="!ml-auto !shrink-0 !text-[11px] !text-subtle">
            {option.description}
          </Typography.Text>
        ) : null}
      </span>
    ) : (
      option.label
    )
  };
}

/** Multi-select variant with the same search behaviour and compact chips. */
export function MultiSelect({
  options = [],
  value = [],
  onChange,
  placeholder = "Semua",
  size = "large",
  maxTagCount = "responsive",
  className,
  id,
  disabled
}) {
  return (
    <Select
      id={id}
      mode="multiple"
      className={cn("!w-full", className)}
      value={value}
      onChange={onChange}
      size={size}
      disabled={disabled}
      allowClear
      showSearch
      placeholder={placeholder}
      maxTagCount={maxTagCount}
      optionFilterProp="label"
      filterOption={(input, option) => normalise(option?.label).includes(normalise(input))}
      options={options.map((option) => ({ value: option.value, label: option.label }))}
    />
  );
}
