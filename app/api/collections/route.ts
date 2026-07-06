import { NextResponse } from "next/server";
import { getOperator } from "@/lib/auth";
import { listCollections } from "@/lib/obelisk";

export async function GET() {
  if (!(await getOperator())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ collections: await listCollections() });
  } catch {
    return NextResponse.json({ collections: [] });
  }
}
