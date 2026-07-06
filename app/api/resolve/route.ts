import { NextResponse } from "next/server";
import { getOperator } from "@/lib/auth";
import { resolveActor } from "@/lib/bsky";

export async function GET(req: Request) {
  if (!(await getOperator())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const actor = new URL(req.url).searchParams.get("actor")?.trim();
  if (!actor) return NextResponse.json({ error: "actor is required" }, { status: 400 });
  const did = await resolveActor(actor);
  if (!did) return NextResponse.json({ error: `could not resolve "${actor}"` }, { status: 400 });
  return NextResponse.json({ did });
}
