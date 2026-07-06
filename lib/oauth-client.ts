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

/** The live origin, or null on the server. */
function origin(): string | null {
  return typeof window === "undefined" ? null : window.location.origin;
}

function isLoopback(o: string): boolean {
  return o.startsWith("http://127.0.0.1") || o.startsWith("http://localhost");
}

function redirectUri(): string {
  const o = origin();
  if (o && !isLoopback(o)) return `${o}/oauth/callback`;
  return process.env.NEXT_PUBLIC_OAUTH_REDIRECT ?? "http://127.0.0.1:3000/oauth/callback";
}

/**
 * The public client_id. On a real host it's the hosted client-metadata.json URL,
 * derived from the current origin (so the image is domain-agnostic — the served
 * metadata at /oauth/client-metadata.json derives the same way). On loopback,
 * atproto's localhost client: `http://localhost` with redirect_uri + scope as
 * query params (no metadata fetch). Access dev via 127.0.0.1 so the host matches.
 */
function clientId(): string {
  const o = origin();
  if (o && !isLoopback(o)) return `${o}/oauth/client-metadata.json`;
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
