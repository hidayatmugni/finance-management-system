import { BgColorsOutlined, CheckOutlined } from "@ant-design/icons";
import { Button, Dropdown, Typography } from "antd";
import { useTheme } from "../design/ThemeProvider";
import { cn } from "./utils";

/**
 * Theme picker. Each row previews the actual palette so the choice is made by
 * looking, not by reading a name.
 *
 * Rendering is suppressed when the CMS has locked the theme for the family.
 */
export function ThemeSwitcher({ variant = "icon", className }) {
  const { themeId, options, canSwitch, setTheme } = useTheme();

  if (!canSwitch) return null;

  const items = options.map((option) => ({
    key: option.value,
    label: (
      <div className="flex min-w-[220px] items-center gap-3 py-1">
        <span className="flex shrink-0 gap-0.5">
          {option.preview.map((color) => (
            <span
              key={color}
              className="h-5 w-2.5 first:rounded-l-sm last:rounded-r-sm"
              style={{ backgroundColor: color }}
              aria-hidden
            />
          ))}
        </span>
        <span className="min-w-0 flex-1">
          <Typography.Text className="!block !text-body !font-medium !text-ink">
            {option.label}
          </Typography.Text>
          <Typography.Text className="!block !truncate !text-caption !text-muted">
            {option.description}
          </Typography.Text>
        </span>
        {themeId === option.value ? <CheckOutlined className="shrink-0 text-primary-ink" /> : null}
      </div>
    )
  }));

  return (
    <Dropdown
      menu={{ items, onClick: ({ key }) => setTheme(key) }}
      trigger={["click"]}
      placement="bottomRight"
    >
      {variant === "icon" ? (
        <Button
          icon={<BgColorsOutlined />}
          className={cn("!h-9 !w-9 !p-0", className)}
          aria-label="Ganti tema"
        />
      ) : (
        <Button icon={<BgColorsOutlined />} className={className}>
          Tema
        </Button>
      )}
    </Dropdown>
  );
}

/**
 * Full-width theme cards for the settings / CMS page, where there is room to
 * show the palette larger.
 */
export function ThemeGallery({ value, onChange, className }) {
  const { options } = useTheme();

  return (
    <div className={cn("grid gap-3 sm:grid-cols-3", className)}>
      {options.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-lg border p-3 text-left transition",
              isActive
                ? "border-primary ring-2 ring-primary/30"
                : "border-line hover:border-line-strong",
            )}
          >
            <span className="flex overflow-hidden rounded-md">
              {option.preview.map((color) => (
                <span
                  key={color}
                  className="h-10 flex-1"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
              ))}
            </span>
            <Typography.Text className="!mt-2.5 !block !text-body !font-semibold !text-ink">
              {option.label}
              {isActive ? <CheckOutlined className="ml-1.5 text-primary-ink" /> : null}
            </Typography.Text>
            <Typography.Text className="!mt-0.5 !block !text-caption !leading-5 !text-muted">
              {option.description}
            </Typography.Text>
          </button>
        );
      })}
    </div>
  );
}
