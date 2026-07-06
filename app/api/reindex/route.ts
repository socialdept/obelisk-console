import { NextResponse } from "next/server";
import { getOperator } from "@/lib/auth";
import { resolveActor } from "@/lib/bsky";
import { backfillRepo } from "@/lib/obelisk";

export async function POST(req: Request) {
  if (!(await getOperator())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { actor?: string; all?: boolean };
  const input = (b.actor ?? "").trim();
  if (!input) return NextResponse.json({ error: "actor is required" }, { status: 400 });

  const did = await resolveActor(input);
  if (!did) return NextResponse.json({ error: `Could not resolve "${input}" to a DID` }, { status: 400 });

  try {
    const data = await backfillRepo({ did, all: b.all });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
