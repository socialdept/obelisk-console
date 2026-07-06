import { NextResponse } from "next/server";
import { getOperator } from "@/lib/auth";
import { getProfiles, resolveActor } from "@/lib/bsky";
import { getFootprint } from "@/lib/obelisk";

export async function GET(req: Request) {
  if (!(await getOperator())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const actor = new URL(req.url).searchParams.get("actor")?.trim();
  if (!actor) return NextResponse.json({ error: "actor is required" }, { status: 400 });

  const did = await resolveActor(actor);
  if (!did) return NextResponse.json({ error: `could not resolve "${actor}"` }, { status: 400 });

  try {
    const footprint = await getFootprint(did, true);
    const profiles = await getProfiles([did]);
    return NextResponse.json({ footprint, profile: profiles[did] ?? null });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
