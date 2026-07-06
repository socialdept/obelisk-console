import { NextResponse } from "next/server";
import { getOperator } from "@/lib/auth";
import { createAudience } from "@/lib/obelisk";

export async function POST(req: Request) {
  if (!(await getOperator())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { name?: string; definition?: unknown };
  if (!body.name || !body.definition) {
    return NextResponse.json({ error: "name and definition are required" }, { status: 400 });
  }
  try {
    const data = await createAudience(body.name, body.definition);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
