"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface SeriesPoint {
  ts: number;
  pending: number;
  embedRate: number;
  ingestRate: number;
}

function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const axis = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover text-popover-foreground rounded-md border px-3 py-2 text-xs shadow-md">
      <div className="text-muted-foreground mb-1">{fmtTime(label)}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          <span className="capitalize">{p.name}</span>
          <span className="ml-auto font-mono">{Number(p.value).toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
        </div>
      ))}
    </div>
  );
}

export function RateChart({ data }: { data: SeriesPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="ts" tickFormatter={fmtTime} minTickGap={40} {...axis} />
        <YAxis width={40} {...axis} />
        <Tooltip content={<ChartTooltip />} />
        <Line type="monotone" dataKey="embedRate" name="embeds/s" stroke="var(--chart-1)" strokeWidth={2} dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="ingestRate" name="ingest/s" stroke="var(--chart-2)" strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PendingChart({ data }: { data: SeriesPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="pendingFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="ts" tickFormatter={fmtTime} minTickGap={40} {...axis} />
        <YAxis width={40} {...axis} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)} />
        <Tooltip content={<ChartTooltip />} />
        <Area type="monotone" dataKey="pending" name="pending" stroke="var(--chart-3)" strokeWidth={2} fill="url(#pendingFill)" isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
