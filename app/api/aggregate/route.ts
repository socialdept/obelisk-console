import { NextResponse } from "next/server";
import { getOperator } from "@/lib/auth";
import { aggregate } from "@/lib/obelisk";

export async function GET(req: Request) {
  if (!(await getOperator())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const p = new URL(req.url).searchParams;
  try {
    const data = await aggregate({
      source: p.get("source") ?? undefined,
      groupBy: p.get("groupBy") ?? undefined,
      aggregate: p.get("aggregate") ?? undefined,
      since: p.get("since") ?? undefined,
      limit: p.get("limit") ? Number(p.get("limit")) : undefined,
    });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message) }, { status: 502 });
  }
}
