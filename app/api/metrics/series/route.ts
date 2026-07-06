import { NextResponse } from "next/server";
import { getOperator } from "@/lib/auth";
import { db } from "@/lib/db";

const WINDOWS: Record<string, number> = {
  "15m": 15 * 60_000,
  "1h": 60 * 60_000,
  "6h": 6 * 60 * 60_000,
  "24h": 24 * 60 * 60_000,
  "7d": 7 * 24 * 60 * 60_000,
};

interface Row {
  ts: number;
  embed_pending: number;
  embeds_completed: number;
  ingester_applied: number;
}

export async function GET(req: Request) {
  if (!(await getOperator())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const win = new URL(req.url).searchParams.get("window") ?? "1h";
  const windowMs = WINDOWS[win] ?? WINDOWS["1h"];

  const rows = db()
    .prepare(
      `SELECT ts, embed_pending, embeds_completed, ingester_applied
       FROM metric_samples WHERE ts >= ? ORDER BY ts ASC`,
    )
    .all(Date.now() - windowMs) as Row[];

  // Rates are deltas of the monotonic counters between adjacent samples.
  const points: { ts: number; pending: number; embedRate: number; ingestRate: number }[] = [];
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1]!;
    const b = rows[i]!;
    const dt = (b.ts - a.ts) / 1000;
    if (dt <= 0) continue;
    points.push({
      ts: b.ts,
      pending: b.embed_pending,
      embedRate: b.embeds_completed >= a.embeds_completed ? (b.embeds_completed - a.embeds_completed) / dt : 0,
      ingestRate: b.ingester_applied >= a.ingester_applied ? (b.ingester_applied - a.ingester_applied) / dt : 0,
    });
  }

  return NextResponse.json({ window: win, points });
}
