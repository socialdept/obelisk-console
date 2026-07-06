import { NextResponse } from "next/server";
import { getOperator } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBackfillStatus, hasToken, readyz, type BackfillCollection, type ReadyReport } from "@/lib/obelisk";

interface SampleRow {
  ts: number;
  embed_pending: number;
  embeds_completed: number;
  ingester_applied: number;
}

export async function GET() {
  if (!(await getOperator())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const token = hasToken();
  const [readyResult, backfillResult] = await Promise.allSettled([
    readyz(),
    token ? getBackfillStatus() : Promise.resolve<{ collections: BackfillCollection[] }>({ collections: [] }),
  ]);

  const rows = db()
    .prepare(
      `SELECT ts, embed_pending, embeds_completed, ingester_applied
       FROM metric_samples ORDER BY ts DESC LIMIT 2`,
    )
    .all() as SampleRow[];

  let latest: { pending: number; embedRate: number; ingestRate: number } | null = null;
  if (rows.length === 2) {
    const [b, a] = rows;
    const dt = (b!.ts - a!.ts) / 1000;
    latest = {
      pending: b!.embed_pending,
      embedRate: dt > 0 && b!.embeds_completed >= a!.embeds_completed ? (b!.embeds_completed - a!.embeds_completed) / dt : 0,
      ingestRate: dt > 0 && b!.ingester_applied >= a!.ingester_applied ? (b!.ingester_applied - a!.ingester_applied) / dt : 0,
    };
  } else if (rows.length === 1) {
    latest = { pending: rows[0]!.embed_pending, embedRate: 0, ingestRate: 0 };
  }

  const ready: ReadyReport | null = readyResult.status === "fulfilled" ? readyResult.value : null;

  return NextResponse.json({
    hasToken: token,
    ready,
    readyError: readyResult.status === "rejected" ? String((readyResult.reason as Error)?.message ?? readyResult.reason) : null,
    backfill: backfillResult.status === "fulfilled" ? backfillResult.value.collections : [],
    latest,
  });
}
