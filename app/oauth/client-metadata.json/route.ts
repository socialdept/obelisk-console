import { NextResponse } from "next/server";

/**
 * The atproto OAuth client metadata (public web client). `client_id` MUST equal
 * the URL this is served from — we derive it from the request origin so the image
 * stays domain-agnostic (matches lib/oauth-client.ts, which derives the same way).
 * Public client (`token_endpoint_auth_method: none`) — no server secret; the
 * console attests the DID and gates it against the operator allowlist server-side.
 */
export function GET(req: Request) {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("host") ?? new URL(req.url).host;
  const origin = `${proto}://${host}`;

  return NextResponse.json(
    {
      client_id: `${origin}/oauth/client-metadata.json`,
      client_name: "Obelisk Console",
      client_uri: origin,
      redirect_uris: [`${origin}/oauth/callback`],
      scope: "atproto",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      application_type: "web",
      token_endpoint_auth_method: "none",
      dpop_bound_access_tokens: true,
    },
    { headers: { "content-type": "application/json", "cache-control": "public, max-age=300" } },
  );
}
