# Obelisk Console

> Operator dashboard for the [Obelisk](https://github.com/socialdept/obelisk) AT Protocol archive — **observe** its vitals over time and **manage** it, without curl.

## What

A standalone web console that talks to an Obelisk instance over its HTTP API:

- **Observe** — live charts of embed rate, ingest rate, and queue depth (from Obelisk's `/metrics`), component health (`/readyz`), backfill progress, and archive stats (`aggregate`). Metric history is persisted so it survives reloads/restarts.
- **Manage** — blocklists (DID/PDS), watched DIDs, webhooks, audiences, and backfill triggers (wrapping Obelisk's service-plane procedures).

## Why

Obelisk is intentionally headless (its `SCOPE.md` puts UI/admin out of scope — "a different project"). The console is that different project: the archive stays a lean single unit, and everything operator-facing lives here.

## How

- **Next.js** (App Router) + **TailwindCSS** + **shadcn/ui** (base-ui).
- **Two-layer auth:**
  - _Human → console:_ **atproto OAuth** (`@atcute`, public client, `atproto` scope — identity only). Log in with a Bluesky handle; your DID is checked against an allowlist.
  - _Console → archive:_ the Obelisk **bearer token** is held server-side (`OBELISK_API_TOKEN`) and proxied — the browser never sees it.
- **SQLite** for the console's own state (metrics time-series, operators, sessions) — never touches Obelisk's Postgres.
- **Everything is auth-gated.**

## Run

```bash
cp .env.example .env        # set OBELISK_API_URL, OBELISK_API_TOKEN, OPERATOR_DIDS, SESSION_SECRET
bun install
bun run dev                 # http://localhost:3000
```

Runs anywhere — **not** on the $6 archive box.

## Status

🚧 In progress. Scaffold up (Next.js + Tailwind + shadcn + SQLite, dark-mode shell, connection check). Next: atproto auth gate → Obelisk proxy + metrics poller → observability dashboard → management pages. Tracked in the **Obelisk Console** Linear project (Labs).
