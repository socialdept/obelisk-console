import { obeliskConfig } from "./config";

// Server-side client for the Obelisk archive. The bearer token is injected here
// and never leaves the server.

export class ObeliskError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ObeliskError";
  }
}

const SVC = "/xrpc/social.dept.obelisk.";

async function obeliskFetch(path: string, init?: RequestInit): Promise<Response> {
  const { url, token } = obeliskConfig();
  if (!url) throw new ObeliskError(0, "OBELISK_API_URL is not set");
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${url}${path}`, {
    ...init,
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
}

async function errText(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string; error?: string };
    return body.message ?? body.error ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

/** Whether a token is configured (management/metrics need it). */
export function hasToken(): boolean {
  return Boolean(obeliskConfig().token);
}

// ── generic planes ───────────────────────────────────────────────────

export async function svcQuery<T>(
  verb: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v !== undefined) qs.set(k, String(v));
  }
  const q = qs.toString();
  const res = await obeliskFetch(`${SVC}${verb}${q ? `?${q}` : ""}`);
  if (!res.ok) throw new ObeliskError(res.status, await errText(res));
  return res.json() as Promise<T>;
}

export async function svcProcedure<T>(verb: string, body: unknown): Promise<T> {
  const res = await obeliskFetch(`${SVC}${verb}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw new ObeliskError(res.status, await errText(res));
  return res.json() as Promise<T>;
}

// ── metrics + health (metrics needs a token; health is open) ─────────

export async function metricsText(): Promise<string> {
  const res = await obeliskFetch("/metrics");
  if (!res.ok) throw new ObeliskError(res.status, `metrics ${res.status}`);
  return res.text();
}

/** Parse Prometheus text-format into a flat name→value map (unlabeled series). */
export function parseMetrics(text: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const line of text.split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const sp = line.lastIndexOf(" ");
    if (sp === -1) continue;
    const name = line.slice(0, sp).trim();
    const value = Number(line.slice(sp + 1));
    if (name && Number.isFinite(value)) out[name] = value;
  }
  return out;
}

export interface ComponentStatus {
  status: "up" | "degraded" | "down";
  [key: string]: unknown;
}
export interface ReadyReport {
  ok: boolean;
  degraded: boolean;
  components: Record<string, ComponentStatus>;
}

export async function readyz(): Promise<ReadyReport> {
  const res = await obeliskFetch("/readyz");
  return res.json() as Promise<ReadyReport>;
}

// ── typed query wrappers used by the UI ──────────────────────────────

export interface BackfillCollection {
  collection: string;
  recordsArchived: number;
  recordsIncludingDeleted: number;
  reposSeen: number;
  reposCaughtUp: number;
  backfillRatePerSec: number;
  liveRatePerSec: number;
  backfilling: boolean;
  complete: boolean;
  lastEventAt: string | null;
}

export function getBackfillStatus() {
  return svcQuery<{ collections: BackfillCollection[] }>("getBackfillStatus");
}

// ── record search / lookup (collection plane) ───────────────────────

export interface SearchRecord {
  uri: string;
  cid: string | null;
  did: string;
  collection: string;
  value: unknown;
  indexedAt: string;
  rank?: number;
  score?: number;
  distance?: number;
  highlight?: string;
}

export interface SearchResponse {
  records: SearchRecord[];
  facets?: Record<string, { value: string; count: number }[]>;
}

export async function searchRecords(
  collection: string,
  body: { q: string; mode?: string; ranking?: string; highlight?: boolean; limit?: number },
): Promise<SearchResponse> {
  const res = await obeliskFetch(`/xrpc/${collection}.searchRecords`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new ObeliskError(res.status, await errText(res));
  return res.json() as Promise<SearchResponse>;
}

/** Parse the collection NSID out of an `at://did/collection/rkey` URI. */
export function collectionFromUri(uri: string): string | null {
  const m = uri.match(/^at:\/\/[^/]+\/([^/]+)\/[^/]+$/);
  return m ? m[1]! : null;
}

export async function getRecordByUri(uri: string): Promise<SearchRecord> {
  const collection = collectionFromUri(uri);
  if (!collection) throw new ObeliskError(400, "not a record AT URI (at://did/collection/rkey)");
  const res = await obeliskFetch(`/xrpc/${collection}.getRecord?uri=${encodeURIComponent(uri)}`);
  if (!res.ok) throw new ObeliskError(res.status, await errText(res));
  return res.json() as Promise<SearchRecord>;
}

export interface TypeEntry {
  nsid?: string;
  type?: string;
  count: number;
  [k: string]: unknown;
}
export const getTypes = (params?: { collection?: string; path?: string }) =>
  svcQuery<{ types: TypeEntry[] }>("getTypes", params);

export const createAudience = (name: string, definition: unknown) =>
  svcProcedure("createAudience", { name, definition });
export const updateAudience = (name: string, definition: unknown) =>
  svcProcedure("updateAudience", { name, definition });
export interface AudiencePreview {
  count: number;
  members: string[];
  limit: number;
}
export const previewAudience = (definition: unknown, limit = 24) =>
  svcProcedure<AudiencePreview>("previewAudience", { definition, limit });

export interface AggregateGroup {
  key: Record<string, string>;
  count: number;
}
export function aggregate(params: {
  source?: string;
  groupBy?: string;
  aggregate?: string;
  since?: string;
  until?: string;
  orderBy?: string;
  limit?: number;
}) {
  return svcQuery<{ groups: AggregateGroup[] }>("aggregate", params);
}

// list queries
export const getBlockedDids = () => svcQuery<{ blockedDids: BlockedDid[] }>("getBlockedDids");
export const getBlockedPdses = () => svcQuery<{ blockedPdses: BlockedPds[] }>("getBlockedPdses");
export const getWebhooks = () => svcQuery<{ webhooks: Webhook[] }>("getWebhooks");
export const getAudiences = () => svcQuery<{ audiences: Audience[] }>("getAudiences");
export const getAudienceMembers = (name: string, limit = 50) =>
  svcQuery<{ name: string; members: string[]; limit: number; offset: number }>("getAudienceMembers", { name, limit });
export const listCollections = async (): Promise<string[]> => {
  const { groups } = await aggregate({ groupBy: "collection" });
  return groups.map((g) => g.key.collection).filter(Boolean).sort();
};
export const getFootprint = (did: string, includeDeleted = false) =>
  svcQuery<Footprint>("getFootprint", { did, includeDeleted: includeDeleted ? 1 : undefined });

export interface CreateWebhookInput {
  name: string;
  url: string;
  collections?: string[];
  actions?: string[];
  record_matchers?: Record<string, string>;
  include_record?: boolean;
  max_events?: number;
  max_wait_ms?: number;
  from_cursor?: number | "start";
}
export const createWebhook = (b: CreateWebhookInput) =>
  svcProcedure<{ webhook: Webhook & { secret: string } }>("createWebhook", b);

// procedures
export const addBlockedDid = (b: { did: string; note?: string; purge?: boolean; force?: boolean }) =>
  svcProcedure("addBlockedDid", b);
export const removeBlockedDid = (did: string) => svcProcedure("removeBlockedDid", { did });
export const addBlockedPds = (b: { pattern: string; note?: string }) => svcProcedure("addBlockedPds", b);
export const removeBlockedPds = (pattern: string) => svcProcedure("removeBlockedPds", { pattern });
export const deleteWebhook = (id: number) => svcProcedure("deleteWebhook", { id });
export const testWebhook = (id: number) => svcProcedure("testWebhook", { id });
export const deleteAudience = (name: string) => svcProcedure("deleteAudience", { name });
export const backfillEvents = (b: { collection?: string; did?: string }) => svcProcedure("backfillEvents", b);

// loose response types
export interface BlockedDid {
  did: string;
  note?: string | null;
  addedAt: string;
}
export interface BlockedPds {
  pattern: string;
  note?: string | null;
  addedAt: string;
}
export interface Webhook {
  id: number;
  name: string;
  url: string;
  status: string;
  failureCount: number;
  lastDeliveryAt?: string | null;
  createdAt: string;
}
export interface Audience {
  id: number;
  name: string;
  definition: unknown;
}
export interface Footprint {
  did: string;
  watched: boolean;
  totals: { records: number; deleted: number };
  collections: { collection: string; count: number; deleted: number }[];
}
