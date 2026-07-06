import { NextResponse } from "next/server";
import { getOperator } from "@/lib/auth";
import { resolveActor } from "@/lib/bsky";
import { addBlockedDid } from "@/lib/obelisk";

export async function POST(req: Request) {
  if (!(await getOperator())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { actor?: string; note?: string; purge?: boolean; force?: boolean };
  const did = await resolveActor(String(b.actor ?? ""));
  if (!did) return NextResponse.json({ error: `could not resolve "${b.actor}"` }, { status: 400 });
  try {
    const data = await addBlockedDid({ did, note: b.note || undefined, purge: b.purge, force: b.force });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
