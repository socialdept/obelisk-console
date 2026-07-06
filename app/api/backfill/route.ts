import { NextResponse } from "next/server";
import { getOperator } from "@/lib/auth";
import { backfillEvents } from "@/lib/obelisk";

export async function POST(req: Request) {
  if (!(await getOperator())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { collection?: string; did?: string };
  try {
    const data = await backfillEvents({ collection: b.collection || undefined, did: b.did || undefined });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
