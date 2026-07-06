import { Activity, CheckCircle2, Database, Layers, Radio, XCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOperator } from "@/lib/auth";
import { obeliskConfig } from "@/lib/config";

type Health = "up" | "down" | "unset";

async function checkHealth(url: string): Promise<Health> {
  if (!url) return "unset";
  try {
    const res = await fetch(`${url}/healthz`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    return res.ok ? "up" : "down";
  } catch {
    return "down";
  }
}

const PANELS = [
  { icon: Activity, title: "Embeddings", desc: "Embed rate & queue depth over time" },
  { icon: Radio, title: "Ingest", desc: "Records applied per interval from Tab" },
  { icon: Database, title: "Health", desc: "DB, ingester, embedder & worker status" },
  { icon: Layers, title: "Backfill", desc: "Per-collection progress & completion" },
] as const;

export default async function Home() {
  const operator = await requireOperator();
  const { url } = obeliskConfig();
  const health = await checkHealth(url);

  return (
    <AppShell obeliskUrl={url} operator={operator}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">Overview</h1>
            <p className="text-muted-foreground text-sm">Live vitals for the connected archive.</p>
          </div>
          <ConnectionBadge health={health} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PANELS.map((p) => (
            <Card key={p.title} className="border-dashed">
              <CardHeader>
                <div className="text-muted-foreground flex items-center gap-2">
                  <p.icon className="h-4 w-4" />
                  <CardTitle className="text-sm font-medium">{p.title}</CardTitle>
                </div>
                <CardDescription>{p.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="text-muted-foreground text-xs">
                  wiring up
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-muted-foreground text-sm">
          Scaffold ready. Next: atproto login (auth gate), then live metrics charts.
        </p>
      </div>
    </AppShell>
  );
}

function ConnectionBadge({ health }: { health: Health }) {
  if (health === "up") {
    return (
      <Badge variant="secondary" className="gap-1.5">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> archive reachable
      </Badge>
    );
  }
  if (health === "down") {
    return (
      <Badge variant="destructive" className="gap-1.5">
        <XCircle className="h-3.5 w-3.5" /> unreachable
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      not configured
    </Badge>
  );
}
