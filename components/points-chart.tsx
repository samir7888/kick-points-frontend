"use client";

import { useEffect, useId, useState } from "react";
import { format } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  PointsChannelGrowth,
  PointsRange,
  PointsSeriesPoint,
} from "@/lib/api/types";

// Categorical palette for the share donut. Leads with the app accent and reuses
// the semantic status hues before falling back to two extra hues.
const SLICE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--amber))",
  "hsl(var(--win))",
  "hsl(var(--loss))",
  "#8b5cf6",
  "#0ea5e9",
];

/** Compact axis labels: 12_500 -> "12.5k". */
function compact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toLocaleString();
}

/**
 * Human label for a bucket start. Sub-day ranges show the local time; day ranges
 * read the UTC date parts directly so a negative local offset can't shift the
 * label onto the previous day.
 */
export function formatBucket(at: string, range: PointsRange): string {
  if (range === "1h" || range === "24h") {
    return format(new Date(at), "HH:mm");
  }
  const [datePart] = at.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month || !day) return at;
  return format(new Date(year, month - 1, day), "d MMM");
}

/** Shape the combined series for recharts. */
export function toTrendData(series: PointsSeriesPoint[], range: PointsRange) {
  return series.map((point) => ({
    label: formatBucket(point.at, range),
    total: point.total,
  }));
}

/** Shape per-channel balances into share-of-total slices, dropping empties. */
export function toShareData(
  channels: Array<Pick<PointsChannelGrowth, "slug" | "current">>,
) {
  return channels
    .filter((channel) => channel.current > 0)
    .map((channel) => ({ name: channel.slug, value: channel.current }));
}

/** Recharts measures its container after mount; skip the first paint on the server. */
function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

type TooltipEntry = { name?: string; value?: number | string };

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: readonly TooltipEntry[];
  label?: string;
}) {
  const item = payload?.[0];
  if (!active || !item) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-float">
      {label && <p className="text-muted-foreground">{label}</p>}
      {label ? null : item.name && <p className="text-muted-foreground">{item.name}</p>}
      <p className="font-semibold tabular-nums">
        {Number(item.value).toLocaleString()} pts
      </p>
    </div>
  );
}

/** Area chart of the points total over the selected range. */
export function PointsTrendChart({
  points,
  range,
  height = 240,
  className,
}: {
  points: PointsSeriesPoint[];
  range: PointsRange;
  height?: number;
  className?: string;
}) {
  const mounted = useMounted();
  const gradientId = `points-area-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const data = toTrendData(points, range);
  if (data.length < 2) return null;
  return (
    <div className={className} style={{ width: "100%", height }}>
      {mounted && (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="hsl(var(--border))"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              minTickGap={28}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              width={52}
              tickLine={false}
              axisLine={false}
              domain={["auto", "auto"]}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => compact(Number(value))}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="total"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill={`url(#${gradientId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/** Donut of each channel's share of the current total. */
export function PointsShareChart({
  channels,
  height = 240,
  className,
}: {
  channels: Array<Pick<PointsChannelGrowth, "slug" | "current">>;
  height?: number;
  className?: string;
}) {
  const mounted = useMounted();
  const data = toShareData(channels);
  if (data.length < 2) return null;
  return (
    <div className={className} style={{ width: "100%", height }}>
      {mounted && (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={2}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={SLICE_COLORS[index % SLICE_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span className="text-xs text-muted-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
