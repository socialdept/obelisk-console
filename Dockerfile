# Obelisk Console — Next.js 16 standalone server on Node.
#
# Node end-to-end (not Bun): better-sqlite3 is a native addon, and its binary must
# match the runtime ABI — installing under Bun and running under Node mismatches.
# Multi-stage: install (with build tools for the native compile) → build (Next
# standalone) → slim runtime carrying only the standalone bundle + static assets.

FROM node:22-slim AS deps
WORKDIR /app
# better-sqlite3 uses a prebuilt binary when available, else compiles — keep the
# toolchain here (deps stage only) so the compile fallback works.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json ./
RUN npm install --no-audit --no-fund

FROM node:22-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-slim AS release
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

RUN mkdir -p /data && chown -R node:node /data /app
USER node
EXPOSE 3000
CMD ["node", "server.js"]
