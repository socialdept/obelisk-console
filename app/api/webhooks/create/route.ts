import { NextResponse } from "next/server";
import { getOperator } from "@/lib/auth";
import { createWebhook, type CreateWebhookInput } from "@/lib/obelisk";

export async function POST(req: Request) {
  if (!(await getOperator())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as CreateWebhookInput;
  if (!body.name || !body.url) {
    return NextResponse.json({ error: "name and url are required" }, { status: 400 });
  }
  try {
    const data = await createWebhook(body);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
