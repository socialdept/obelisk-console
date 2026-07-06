import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

// The console's own SQLite — metrics time-series (and later, operator state).
// Never touches Obelisk's Postgres.

let _db: Database.Database | null = null;

export function db(): Database.Database {
  if (_db) return _db;
  const path = process.env.SQLITE_PATH ?? "./data/console.db";
  mkdirSync(dirname(path), { recursive: true });
  const d = new Database(path);
  d.pragma("journal_mode = WAL");
  d.exec(`
    CREATE TABLE IF NOT EXISTS metric_samples (
      ts                  INTEGER PRIMARY KEY,   -- epoch ms
      embed_pending       INTEGER NOT NULL,
      embeds_completed    INTEGER NOT NULL,      -- counter (monotonic since boot)
      embeds_skipped      INTEGER NOT NULL,      -- counter
      ingester_applied    INTEGER NOT NULL,      -- counter
      ingester_skipped    INTEGER NOT NULL,      -- counter
      embed_backoff       INTEGER NOT NULL,
      embedder_up         INTEGER NOT NULL,
      ingester_connected  INTEGER NOT NULL,
      ready               INTEGER NOT NULL,
      degraded            INTEGER NOT NULL
    );
  `);
  _db = d;
  return d;
}
