import { AppShell } from "@/components/app-shell";
import { ActivityChart } from "@/components/activity-chart";
import { ExcludeDidDialog } from "@/components/exclude-did-dialog";
import { DidIdentity, DidLinks } from "@/components/did-identity";
import { Empty, NeedsToken, PageHeader } from "@/components/manage-ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireOperator } from "@/lib/auth";
import { getProfiles, type Profile } from "@/lib/bsky";
import { obeliskConfig } from "@/lib/config";
import { aggregate, getTypes, hasToken, type AggregateGroup, type TypeEntry } from "@/lib/obelisk";

const num = (n?: number | null) => (n ?? 0).toLocaleString();

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

export default async function StatsPage() {
  const operator = await requireOperator();
  const shell = (children: React.ReactNode) => (
    <AppShell obeliskUrl={obeliskConfig().url} operator={operator}>
      <div className="space-y-6">
        <PageHeader title="Stats" description="Aggregate views over the whole archive." />
        {children}
      </div>
    </AppShell>
  );

  if (!hasToken()) return shell(<NeedsToken />);

  const [byCollection, byDid, byDay, types, coldGroups] = await Promise.all([
    safe(aggregate({ groupBy: "collection" }).then((r) => r.groups ?? []), [] as AggregateGroup[]),
    safe(aggregate({ groupBy: "did", limit: 10 }).then((r) => r.groups ?? []), [] as AggregateGroup[]),
    safe(aggregate({ source: "events", groupBy: "createdAt:day" }).then((r) => r.groups ?? []), [] as AggregateGroup[]),
    safe(getTypes().then((r) => r.types ?? []), [] as TypeEntry[]),
    safe(
      aggregate({ groupBy: "collection", where: { cold: { eq: true } } }).then((r) => r.groups ?? []),
      [] as AggregateGroup[],
    ),
  ]);

  const coldByCol = new Map(coldGroups.map((g) => [g.key.collection, g.count]));
  const coldTotal = coldGroups.reduce((s, g) => s + g.count, 0);

  const profiles = await safe(getProfiles(byDid.map((g) => g.key.did).filter(Boolean)), {} as Record<string, Profile>);
  const total = byCollection.reduce((s, g) => s + g.count, 0);
  const maxCol = Math.max(1, ...byCollection.map((g) => g.count));

  const activity = byDay
    .map((g) => ({ label: (g.key["createdAt:day"] ?? "").slice(5, 10), count: g.count, raw: g.key["createdAt:day"] ?? "" }))
    .sort((a, b) => a.raw.localeCompare(b.raw));

  return shell(
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total records" value={num(total)} />
        <Stat label="Cold records" value={num(coldTotal)} hint={total > 0 ? `${((coldTotal / total) * 100).toFixed(1)}% of the archive` : undefined} />
        <Stat label="Collections" value={num(byCollection.length)} />
        <Stat label="$types seen" value={num(types.length)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-sm font-medium">Records by collection</CardTitle>
              {coldTotal > 0 && (
                <div className="text-muted-foreground flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="bg-primary size-2 rounded-full" /> hot
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-sky-400" /> cold
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {byCollection.length === 0 ? (
              <Empty>No data.</Empty>
            ) : (
              byCollection
                .slice()
                .sort((a, b) => b.count - a.count)
                .map((g) => {
                  const cold = coldByCol.get(g.key.collection) ?? 0;
                  const hot = Math.max(0, g.count - cold);
                  return (
                    <div key={g.key.collection} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-mono">{g.key.collection}</span>
                        <span className="tabular-nums">
                          {num(g.count)}
                          {cold > 0 && <span className="text-muted-foreground"> · {num(cold)} cold</span>}
                        </span>
                      </div>
                      <div className="bg-muted flex h-1.5 w-full overflow-hidden rounded-full">
                        <div className="bg-primary h-full" style={{ width: `${(hot / maxCol) * 100}%` }} />
                        <div className="h-full bg-sky-400" style={{ width: `${(cold / maxCol) * 100}%` }} />
                      </div>
                    </div>
                  );
                })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Activity</CardTitle>
            <CardDescription>records applied per day</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.length > 0 ? <ActivityChart data={activity} /> : <Empty>No events.</Empty>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Most prolific repos</CardTitle>
          <CardDescription>Flooding the archive? Exclude it — block it entirely, or cool it (keep, don&apos;t embed).</CardDescription>
        </CardHeader>
        <CardContent>
          {byDid.length === 0 ? (
            <Empty>No data.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Repo</TableHead>
                  <TableHead className="text-right">Records</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byDid.map((g) => (
                  <TableRow key={g.key.did}>
                    <TableCell>
                      <DidIdentity did={g.key.did} profile={profiles[g.key.did]} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{num(g.count)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <DidLinks did={g.key.did} handle={profiles[g.key.did]?.handle} />
                        <ExcludeDidDialog did={g.key.did} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>,
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="font-heading mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        {hint && <p className="text-muted-foreground mt-0.5 text-xs">{hint}</p>}
      </CardContent>
    </Card>
  );
}
