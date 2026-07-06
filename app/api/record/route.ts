import { NextResponse } from "next/server";
import { getOperator } from "@/lib/auth";
import { getProfiles } from "@/lib/bsky";
import { getRecordByUri, ObeliskError } from "@/lib/obelisk";

export async function GET(req: Request) {
  if (!(await getOperator())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const uri = new URL(req.url).searchParams.get("uri")?.trim();
  if (!uri) return NextResponse.json({ error: "uri is required" }, { status: 400 });

  try {
    const record = await getRecordByUri(uri);
    const profiles = await getProfiles([record.did]);
    return NextResponse.json({ record, profile: profiles[record.did] ?? null });
  } catch (e) {
    const status = e instanceof ObeliskError ? e.status || 400 : 400;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
