import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Typography } from "antd";
import { useTheme } from "../design/ThemeProvider";
import { EmptyState } from "./EmptyState";
import { cn } from "./utils";

/**
 * Chart wrappers.
 *
 * Recharts needs literal colour strings, so these read the active theme through
 * `useTheme()` instead of CSS variables — that is the one place charts differ
 * from the rest of the design system.
 */

function ChartTooltip({ active, payload, label, valueFormatter }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2 shadow-lg">
      {label ? (
        <Typography.Text className="!mb-1 !block !text-caption !font-semibold !text-muted">
          {label}
        </Typography.Text>
      ) : null}
      {payload.map((entry) => (
        <div key={entry.dataKey ?? entry.name} className="flex items-center gap-2 py-0.5">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: entry.color || entry.payload?.fill }}
            aria-hidden
          />
          <span className="text-small text-muted">{entry.name}</span>
          <span className="ml-auto pl-3 text-small font-semibold text-ink">
            {valueFormatter ? valueFormatter(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function ChartFrame({ height, isEmpty, emptyLabel, children, className }) {
  if (isEmpty) {
    return (
      <div style={{ height }} className={cn("flex items-center justify-center", className)}>
        <EmptyState compact title={emptyLabel || "Belum ada data"} description={null} />
      </div>
    );
  }

  return (
    <div style={{ height }} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Time series. `variant` picks the mark: `area` for volume, `line` for precise
 * comparison, `bar` for discrete periods.
 *
 * @param {{key: string, label: string, color?: string}[]} series
 */
export function TrendChart({
  data = [],
  series = [],
  xKey = "label",
  height = 260,
  variant = "area",
  valueFormatter,
  axisFormatter,
  emptyLabel,
  showLegend = true
}) {
  const { colors, chart } = useTheme();
  const axisStyle = { fontSize: 11, fill: colors.textSecondary };

  const resolvedSeries = series.map((item, index) => ({
    ...item,
    color: item.color || chart[index % chart.length]
  }));

  const ChartComponent = variant === "bar" ? BarChart : variant === "line" ? LineChart : AreaChart;

  return (
    <ChartFrame height={height} isEmpty={data.length === 0} emptyLabel={emptyLabel}>
      <ChartComponent data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
        <defs>
          {resolvedSeries.map((item) => (
            <linearGradient key={item.key} id={`grad-${item.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={item.color} stopOpacity={0.26} />
              <stop offset="100%" stopColor={item.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
        <XAxis dataKey={xKey} tick={axisStyle} tickLine={false} axisLine={false} />
        <YAxis
          tick={axisStyle}
          tickLine={false}
          axisLine={false}
          width={60}
          tickFormatter={axisFormatter}
        />
        <Tooltip
          cursor={{ fill: colors.surfaceHover, stroke: colors.border }}
          content={<ChartTooltip valueFormatter={valueFormatter} />}
        />
        {showLegend ? (
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        ) : null}

        {resolvedSeries.map((item) =>
          variant === "bar" ? (
            <Bar
              key={item.key}
              dataKey={item.key}
              name={item.label}
              fill={item.color}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          ) : variant === "line" ? (
            <Line
              key={item.key}
              type="monotone"
              dataKey={item.key}
              name={item.label}
              stroke={item.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ) : (
            <Area
              key={item.key}
              type="monotone"
              dataKey={item.key}
              name={item.label}
              stroke={item.color}
              strokeWidth={2}
              fill={`url(#grad-${item.key})`}
            />
          ),
        )}
      </ChartComponent>
    </ChartFrame>
  );
}

/** Composition donut — the hole carries the total, which a pie cannot show. */
export function DonutChart({
  data = [],
  height = 260,
  valueFormatter,
  centerLabel,
  centerValue,
  emptyLabel
}) {
  const { colors, chart } = useTheme();

  return (
    <div className="relative">
      <ChartFrame height={height} isEmpty={data.length === 0} emptyLabel={emptyLabel}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="58%"
            outerRadius="82%"
            paddingAngle={2}
            stroke={colors.surface}
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={entry.color || chart[index % chart.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} />
        </PieChart>
      </ChartFrame>

      {data.length > 0 && centerValue ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <Typography.Text className="!text-caption !font-medium !uppercase !text-muted">
            {centerLabel}
          </Typography.Text>
          <Typography.Text className="!text-subtitle !font-bold !text-ink">
            {centerValue}
          </Typography.Text>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Ranked horizontal bars — the right answer to "which is biggest?", where a pie
 * forces the reader to compare angles.
 */
export function RankedBarList({ items = [], valueFormatter, emptyLabel, max = 6 }) {
  const { chart } = useTheme();

  if (items.length === 0) {
    return <EmptyState compact title={emptyLabel || "Belum ada data"} description={null} />;
  }

  const visible = items.slice(0, max);
  const peak = Math.max(...visible.map((item) => Math.abs(item.value)), 1);

  return (
    <div className="space-y-3">
      {visible.map((item, index) => {
        const color = item.color || chart[index % chart.length];

        return (
          <div key={item.name}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                <Typography.Text className="!truncate !text-body !text-ink">
                  {item.name}
                </Typography.Text>
              </span>
              <Typography.Text className="!shrink-0 !text-body !font-semibold !tabular-nums !text-ink">
                {valueFormatter ? valueFormatter(item.value) : item.value}
              </Typography.Text>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.max((Math.abs(item.value) / peak) * 100, 2)}%`,
                  backgroundColor: color
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
