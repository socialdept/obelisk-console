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

## Deploy (VPS, behind the archive's Caddy)

The console ships as its own Docker stack, but a single box can only bind 80/443 once — so it sits behind the **archive's existing Caddy** (one added vhost), on a subdomain (e.g. `console.obelisk.socialde.pt`). The app derives its atproto OAuth `client_id`/redirect from the request origin at runtime (and serves `/oauth/client-metadata.json` itself), so there's nothing domain-specific to bake in.

**1. DNS** — point `console.obelisk.socialde.pt`'s A record at the VPS.

**2. Get the source onto the box.** The repo has no remote — either push it to a private git remote and clone, or `rsync` the directory up (skip `node_modules`/`.next`).

**3. Archive side — enable the console vhost** (in the obelisk repo on the box):
```bash
echo 'CONSOLE_DOMAIN=console.obelisk.socialde.pt' >> .env        # in the archive's .env
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d caddy   # reload Caddy
```
Caddy will auto-issue a cert for the subdomain and reverse-proxy it to `console:3000` over the shared network.

**4. Console side — build & run:**
```bash
cp .env.production.example .env     # fill OBELISK_API_*, OPERATOR_DIDS, SESSION_SECRET (openssl rand -hex 32)
docker compose up -d --build
```
The console joins the archive's `obelisk_default` network (verify the name: `docker network ls | grep default`). On that network it can reach the archive internally at `http://app:6060` (set `OBELISK_API_URL` to that for no public round-trip) or use the public URL.

**5.** Open `https://console.obelisk.socialde.pt`, sign in with an operator handle. Done.

Notes: OAuth needs no `NEXT_PUBLIC_*` vars (origin-derived). The metrics DB persists in the `consoledata` volume. The console is a public atproto client (`token_endpoint_auth_method: none`) — access is gated by the `OPERATOR_DIDS` allowlist server-side, and the archive token never reaches the browser.

## Status

🚧 Usable, deployable. Built: atproto login + operator allowlist + auth gate · server-side Obelisk proxy · SQLite metrics poller · live **dashboard** (embed/ingest rate + queue-depth charts, health strip, reindex + backfill, stat cards incl. cold split) · **management** (exclusions [block/cool], webhooks, audiences) · **Docker deploy** behind the archive's Caddy w/ origin-derived OAuth (LAB-66). Remaining: visual polish.

### Local test

```bash
cd obelisk-console
cp .env.example .env        # set OBELISK_API_URL, OPERATOR_DIDS (your DID), SESSION_SECRET; add OBELISK_API_TOKEN for metrics/management
bun run dev
```
Open **http://127.0.0.1:3000** (use `127.0.0.1`, not `localhost` — the atproto loopback OAuth client pins the redirect host), sign in with your handle, and you land on the dashboard. Charts fill in ~1 min once a token is set and the poller has ≥2 samples.

Tracked in the **Obelisk Console** Linear project (Labs).
