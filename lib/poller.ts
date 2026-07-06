import { db } from "./db";
import { hasToken, metricsText, parseMetrics } from "./obelisk";

const POLL_MS = 15_000;
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Scrape Obelisk's /metrics into the SQLite time-series so charts have history
 * that survives reloads/restarts. Started once from instrumentation.ts.
 */
export function startPoller(): void {
  const g = globalThis as unknown as { __obkPoller?: boolean };
  if (g.__obkPoller) return; // survive dev HMR re-eval
  g.__obkPoller = true;

  const insert = db().prepare(`
    INSERT OR REPLACE INTO metric_samples
      (ts, embed_pending, embeds_completed, embeds_skipped, ingester_applied,
       ingester_skipped, embed_backoff, embedder_up, ingester_connected, ready, degraded)
    VALUES
      (@ts, @ep, @ec, @es, @ia, @is, @bo, @eu, @ic, @rd, @dg)
  `);
  const prune = db().prepare(`DELETE FROM metric_samples WHERE ts < ?`);

  const tick = async () => {
    if (!hasToken()) return; // /metrics needs the archive token
    try {
      const m = parseMetrics(await metricsText());
      const now = Date.now();
      insert.run({
        ts: now,
        ep: m.obelisk_embed_pending ?? 0,
        ec: m.obelisk_embeds_completed_total ?? 0,
        es: m.obelisk_embeds_skipped_total ?? 0,
        ia: m.obelisk_ingester_applied ?? 0,
        is: m.obelisk_ingester_skipped ?? 0,
        bo: m.obelisk_embed_backoff ?? 0,
        eu: m.obelisk_embedder_up ?? 0,
        ic: m.obelisk_ingester_connected ?? 0,
        rd: m.obelisk_ready ?? 0,
        dg: m.obelisk_degraded ?? 0,
      });
      prune.run(now - RETENTION_MS);
    } catch {
      // transient (archive down / token invalid) — next tick retries
    }
  };

  void tick();
  setInterval(() => void tick(), POLL_MS);
}
