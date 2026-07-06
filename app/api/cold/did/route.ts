import { NextResponse } from "next/server";
import { getOperator } from "@/lib/auth";
import { resolveActor } from "@/lib/bsky";
import { addColdDid } from "@/lib/obelisk";

export async function POST(req: Request) {
  if (!(await getOperator())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { actor?: string; note?: string };
  const did = await resolveActor(String(b.actor ?? ""));
  if (!did) return NextResponse.json({ error: `could not resolve "${b.actor}"` }, { status: 400 });
  try {
    const data = await addColdDid({ did, note: b.note || undefined });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
