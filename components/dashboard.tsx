"use client";

import { AlertTriangle, CheckCircle2, KeyRound, Loader2, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PendingChart, RateChart, type SeriesPoint } from "@/components/metric-charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { BackfillCollection, ReadyReport } from "@/lib/obelisk";

interface StatusResponse {
  hasToken: boolean;
  ready: ReadyReport | null;
  readyError: string | null;
  backfill: BackfillCollection[];
  latest: { pending: number; embedRate: number; ingestRate: number } | null;
}

const WINDOWS = ["15m", "1h", "6h", "24h", "7d"] as const;
type Window = (typeof WINDOWS)[number];

const num = (n: number, d = 0) => n.toLocaleString(undefined, { maximumFractionDigits: d });

export function Dashboard() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [series, setSeries] = useState<SeriesPoint[]>([]);
  const [win, setWin] = useState<Window>("1h");

  const loadStatus = useCallback(async () => {
    const res = await fetch("/api/status", { cache: "no-store" });
    if (res.ok) setStatus(await res.json());
  }, []);

  const loadSeries = useCallback(async (w: Window) => {
    const res = await fetch(`/api/metrics/series?window=${w}`, { cache: "no-store" });
    if (res.ok) setSeries((await res.json()).points ?? []);
  }, []);

  useEffect(() => {
    loadStatus();
    const t = setInterval(loadStatus, 10_000);
    return () => clearInterval(t);
  }, [loadStatus]);

  useEffect(() => {
    loadSeries(win);
    const t = setInterval(() => loadSeries(win), 20_000);
    return () => clearInterval(t);
  }, [win, loadSeries]);

  if (!status) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-56" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="text-muted-foreground text-sm">Live vitals for the connected archive.</p>
        </div>
        {status.ready && <ReadyBadge ready={status.ready} />}
      </div>

      {!status.hasToken && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="flex items-center gap-3 py-4">
            <KeyRound className="size-5 text-amber-500" />
            <div className="text-sm">
              <p className="font-medium">No archive token configured</p>
              <p className="text-muted-foreground">
                Set <code className="font-mono">OBELISK_API_TOKEN</code> in the console&apos;s env to
                unlock metrics, backfill status and management.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Embed queue" value={status.latest ? num(status.latest.pending) : "—"} hint="records pending" />
        <StatCard
          label="Embed rate"
          value={status.latest ? `${num(status.latest.embedRate, 1)}/s` : "—"}
          hint="embeddings completed"
        />
        <StatCard
          label="Ingest rate"
          value={status.latest ? `${num(status.latest.ingestRate, 1)}/s` : "—"}
          hint="records applied"
        />
      </div>

      {/* charts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Throughput</h2>
          <div className="flex gap-1">
            {WINDOWS.map((w) => (
              <Button
                key={w}
                size="sm"
                variant={w === win ? "secondary" : "ghost"}
                className="h-7 px-2 text-xs"
                onClick={() => setWin(w)}
              >
                {w}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Embed vs ingest rate</CardTitle>
              <CardDescription>per second</CardDescription>
            </CardHeader>
            <CardContent>
              {series.length > 1 ? <RateChart data={series} /> : <NoData />}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Embed queue depth</CardTitle>
              <CardDescription>records pending embedding</CardDescription>
            </CardHeader>
            <CardContent>
              {series.length > 1 ? <PendingChart data={series} /> : <NoData />}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* health */}
      {status.ready && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium">Components</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(status.ready.components).map(([name, c]) => (
              <HealthPill key={name} name={name} status={c.status} extra={pillExtra(name, c)} />
            ))}
          </div>
        </div>
      )}

      {/* backfill */}
      {status.backfill.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium">Backfill</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {status.backfill
              .slice()
              .sort((a, b) => b.recordsArchived - a.recordsArchived)
              .map((c) => (
                <BackfillCard key={c.collection} c={c} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="font-heading mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        <p className="text-muted-foreground mt-0.5 text-xs">{hint}</p>
      </CardContent>
    </Card>
  );
}

function ReadyBadge({ ready }: { ready: ReadyReport }) {
  if (!ready.ok)
    return (
      <Badge variant="destructive" className="gap-1.5">
        <XCircle className="size-3.5" /> not ready
      </Badge>
    );
  if (ready.degraded)
    return (
      <Badge className="gap-1.5 bg-amber-500/15 text-amber-600 dark:text-amber-400">
        <AlertTriangle className="size-3.5" /> degraded
      </Badge>
    );
  return (
    <Badge variant="secondary" className="gap-1.5">
      <CheckCircle2 className="size-3.5 text-emerald-500" /> healthy
    </Badge>
  );
}

function HealthPill({ name, status, extra }: { name: string; status: string; extra?: string }) {
  const color =
    status === "up"
      ? "bg-emerald-500"
      : status === "degraded"
        ? "bg-amber-500"
        : "bg-destructive";
  return (
    <div className="bg-card flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs">
      <span className={`size-2 rounded-full ${color}`} />
      <span className="font-medium">{name}</span>
      {extra && <span className="text-muted-foreground">{extra}</span>}
    </div>
  );
}

function pillExtra(name: string, c: Record<string, unknown>): string | undefined {
  if (name === "embedQueue") return `${c.pending ?? 0} pending`;
  if (name === "ingester") return c.connected ? "connected" : "disconnected";
  if (name === "embedder") return String(c.provider ?? "");
  return undefined;
}

function BackfillCard({ c }: { c: BackfillCollection }) {
  return (
    <Card>
      <CardContent className="space-y-2 py-4">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-mono text-xs">{c.collection}</span>
          {c.complete ? (
            <Badge variant="secondary" className="text-xs">
              complete
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              backfilling
            </Badge>
          )}
        </div>
        <p className="font-heading text-xl font-semibold tabular-nums">{num(c.recordsArchived)}</p>
        <div className="text-muted-foreground flex gap-4 text-xs">
          <span>{num(c.backfillRatePerSec, 1)}/s backfill</span>
          <span>{c.reposSeen} repos</span>
        </div>
      </CardContent>
    </Card>
  );
}

function NoData() {
  return (
    <div className="text-muted-foreground flex h-[220px] items-center justify-center gap-2 text-sm">
      <Loader2 className="size-4 animate-spin" /> collecting samples…
    </div>
  );
}
