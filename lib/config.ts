// Server-only configuration. Never import this into a Client Component — the
// Obelisk bearer token must never reach the browser.

export interface ObeliskConfig {
  /** Base URL of the Obelisk archive, e.g. https://obelisk.socialde.pt */
  url: string;
  /** Server-side bearer token for the archive. */
  token: string;
}

export function obeliskConfig(): ObeliskConfig {
  return {
    url: (process.env.OBELISK_API_URL ?? "").replace(/\/$/, ""),
    token: process.env.OBELISK_API_TOKEN ?? "",
  };
}

/** atproto DIDs allowed to log in. Everyone else is refused. */
export function operatorDids(): string[] {
  return (process.env.OPERATOR_DIDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** iron-session cookie secret (must be >= 32 chars). */
export function sessionSecret(): string {
  return process.env.SESSION_SECRET ?? "";
}
