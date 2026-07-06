import { NextResponse } from "next/server";
import { getOperator } from "@/lib/auth";
import { getProfiles } from "@/lib/bsky";
import { ObeliskError, previewAudience } from "@/lib/obelisk";

export async function POST(req: Request) {
  if (!(await getOperator())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { definition } = (await req.json().catch(() => ({}))) as { definition?: unknown };
  if (!definition) return NextResponse.json({ error: "definition is required" }, { status: 400 });
  try {
    const data = await previewAudience(definition);
    const profiles = await getProfiles(data.members);
    return NextResponse.json({ count: data.count, members: data.members, profiles });
  } catch (e) {
    // 501 = the archive predates previewAudience (v0.2.4).
    const unsupported = e instanceof ObeliskError && e.status === 501;
    return NextResponse.json(
      { error: (e as Error).message, unsupported },
      { status: unsupported ? 501 : 400 },
    );
  }
}
