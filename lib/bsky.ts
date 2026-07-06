// Resolve handles + avatars for DIDs via the public Bluesky AppView (no auth).

export interface Profile {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
}

const APPVIEW = "https://public.api.bsky.app";

/**
 * Normalize an actor input to a DID. Pass-through if it's already a DID; if it
 * looks like a handle (contains a dot), resolve it via the AppView. Returns null
 * if it's neither a DID nor a resolvable handle.
 */
export async function resolveActor(input: string): Promise<string | null> {
  const v = input.trim().replace(/^@/, "");
  if (v.startsWith("did:")) return v;
  if (!v.includes(".")) return null;
  try {
    const res = await fetch(`${APPVIEW}/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(v)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { did?: string };
    return data.did ?? null;
  } catch {
    return null;
  }
}

/** Batched profile lookup (getProfiles caps at 25 actors/request). Unresolvable DIDs are omitted. */
export async function getProfiles(dids: string[]): Promise<Record<string, Profile>> {
  const out: Record<string, Profile> = {};
  const unique = [...new Set(dids)].filter(Boolean);

  for (let i = 0; i < unique.length; i += 25) {
    const batch = unique.slice(i, i + 25);
    const qs = new URLSearchParams();
    batch.forEach((d) => qs.append("actors", d));
    try {
      const res = await fetch(`${APPVIEW}/xrpc/app.bsky.actor.getProfiles?${qs}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const data = (await res.json()) as { profiles?: Profile[] };
      for (const p of data.profiles ?? []) {
        out[p.did] = { did: p.did, handle: p.handle, displayName: p.displayName, avatar: p.avatar };
      }
    } catch {
      // AppView blip — leave those DIDs unresolved (UI falls back to the raw DID)
    }
  }
  return out;
}
