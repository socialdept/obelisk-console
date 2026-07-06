# Obelisk Console — Next.js 16 standalone server, run under Bun.
#
# Multi-stage: install (frozen lockfile) → build (Next standalone) → slim runtime
# carrying only the standalone bundle + static assets. better-sqlite3 (native) is
# traced into .next/standalone by Next's output tracing.

FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1 AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM oven/bun:1 AS release
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# Next's standalone server binds to HOSTNAME — 0.0.0.0 so Caddy can reach it.
ENV HOSTNAME=0.0.0.0
# Persisted metrics DB (mount a volume here).
ENV SQLITE_PATH=/data/console.db

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

RUN mkdir -p /data && chown -R bun:bun /data /app
USER bun
EXPOSE 3000
CMD ["bun", "server.js"]
