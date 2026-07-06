import { configureOAuth } from "@atcute/oauth-browser-client";
import {
  CompositeDidDocumentResolver,
  LocalActorResolver,
  PlcDidDocumentResolver,
  WebDidDocumentResolver,
  XrpcHandleResolver,
} from "@atcute/identity-resolver";

/** Base scope: identity only — we don't act on the user's behalf (yet). */
export const OAUTH_SCOPE = "atproto";

function redirectUri(): string {
  return process.env.NEXT_PUBLIC_OAUTH_REDIRECT ?? "http://127.0.0.1:3000/oauth/callback";
}

/**
 * The public client_id. In prod this is a hosted client-metadata.json URL. For
 * localhost dev, atproto uses the loopback client: `http://localhost` with the
 * redirect_uri + scope carried as query params (no metadata fetch). Access the
 * app via 127.0.0.1 (not localhost) so the redirect host matches.
 */
function clientId(): string {
  if (process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID) return process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID;
  const params = new URLSearchParams({ redirect_uri: redirectUri(), scope: OAUTH_SCOPE });
  return `http://localhost?${params.toString()}`;
}

let configured = false;

/** Configure @atcute OAuth once, in the browser. */
export function ensureOAuth(): void {
  if (configured || typeof window === "undefined") return;
  configureOAuth({
    metadata: { client_id: clientId(), redirect_uri: redirectUri() },
    identityResolver: new LocalActorResolver({
      handleResolver: new XrpcHandleResolver({ serviceUrl: "https://public.api.bsky.app" }),
      didDocumentResolver: new CompositeDidDocumentResolver({
        methods: { plc: new PlcDidDocumentResolver(), web: new WebDidDocumentResolver() },
      }),
    }),
  });
  configured = true;
}
