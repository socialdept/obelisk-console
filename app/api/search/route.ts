import { NextResponse } from "next/server";
import { getOperator } from "@/lib/auth";
import { getProfiles } from "@/lib/bsky";
import { searchRecords } from "@/lib/obelisk";

export async function POST(req: Request) {
  if (!(await getOperator())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { collection?: string; q?: string; mode?: string; limit?: number };
  const collection = (b.collection ?? "").trim();
  const q = (b.q ?? "").trim();
  if (!collection || !q) return NextResponse.json({ error: "collection and q are required" }, { status: 400 });

  try {
    const data = await searchRecords(collection, { q, mode: b.mode, highlight: true, limit: b.limit ?? 25 });
    const profiles = await getProfiles(data.records.map((r) => r.did));
    return NextResponse.json({ records: data.records, profiles });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
