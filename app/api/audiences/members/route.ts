import { NextResponse } from "next/server";
import { getOperator } from "@/lib/auth";
import { getProfiles } from "@/lib/bsky";
import { getAudienceMembers } from "@/lib/obelisk";

export async function GET(req: Request) {
  if (!(await getOperator())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const name = new URL(req.url).searchParams.get("name")?.trim();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  try {
    const { members } = await getAudienceMembers(name, 50);
    const profiles = await getProfiles(members);
    return NextResponse.json({ members, profiles });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
