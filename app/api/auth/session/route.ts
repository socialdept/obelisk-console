import { NextResponse } from "next/server";
import { operatorDids } from "@/lib/config";
import { getSession } from "@/lib/session";

/**
 * Establish an operator session after the browser completes atproto OAuth.
 *
 * SECURITY NOTE (POC): the DID is client-attested here — the browser proves it
 * controls the DID to its PDS during OAuth, but the server does not yet
 * independently verify that (a DPoP-bound browser session can't be re-checked
 * server-side without extra machinery). Combined with the allowlist this is
 * acceptable for a locally-run, single-operator tool. Before public exposure,
 * harden to server-verified identity (service-auth JWT verification or full
 * server-side OAuth). Tracked in LAB-61.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { did?: unknown; handle?: unknown };
  const did = typeof body.did === "string" ? body.did : "";
  if (!did.startsWith("did:")) {
    return NextResponse.json({ error: "invalid did" }, { status: 400 });
  }
  if (!operatorDids().includes(did)) {
    return NextResponse.json({ error: "not an operator" }, { status: 403 });
  }

  const session = await getSession();
  session.did = did;
  session.handle = typeof body.handle === "string" ? body.handle : undefined;
  await session.save();

  return NextResponse.json({ ok: true, did });
}
