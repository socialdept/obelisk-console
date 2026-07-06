import { AppShell } from "@/components/app-shell";
import { ActivityChart } from "@/components/activity-chart";
import { DidIdentity, DidLinks } from "@/components/did-identity";
import { Empty, NeedsToken, PageHeader } from "@/components/manage-ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireOperator } from "@/lib/auth";
import { getProfiles, type Profile } from "@/lib/bsky";
import { obeliskConfig } from "@/lib/config";
import { aggregate, getTypes, hasToken, type AggregateGroup, type TypeEntry } from "@/lib/obelisk";

const num = (n: number) => n.toLocaleString();

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

  const [byCollection, byDid, byDay, types] = await Promise.all([
    safe(aggregate({ groupBy: "collection" }).then((r) => r.groups), [] as AggregateGroup[]),
    safe(aggregate({ groupBy: "did", limit: 10 }).then((r) => r.groups), [] as AggregateGroup[]),
    safe(aggregate({ source: "events", groupBy: "createdAt:day" }).then((r) => r.groups), [] as AggregateGroup[]),
    safe(getTypes().then((r) => r.types), [] as TypeEntry[]),
  ]);

  const profiles = await safe(getProfiles(byDid.map((g) => g.key.did).filter(Boolean)), {} as Record<string, Profile>);
  const total = byCollection.reduce((s, g) => s + g.count, 0);
  const maxCol = Math.max(1, ...byCollection.map((g) => g.count));

  const activity = byDay
    .map((g) => ({ label: (g.key["createdAt:day"] ?? "").slice(5, 10), count: g.count, raw: g.key["createdAt:day"] ?? "" }))
    .sort((a, b) => a.raw.localeCompare(b.raw));

  return shell(
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total records" value={num(total)} />
        <Stat label="Collections" value={num(byCollection.length)} />
        <Stat label="$types seen" value={num(types.length)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Records by collection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {byCollection.length === 0 ? (
              <Empty>No data.</Empty>
            ) : (
              byCollection
                .slice()
                .sort((a, b) => b.count - a.count)
                .map((g) => (
                  <div key={g.key.collection} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-mono">{g.key.collection}</span>
                      <span className="tabular-nums">{num(g.count)}</span>
                    </div>
                    <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${(g.count / maxCol) * 100}%` }} />
                    </div>
                  </div>
                ))
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
                  <TableHead className="text-right">Links</TableHead>
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
                      <div className="flex justify-end">
                        <DidLinks did={g.key.did} handle={profiles[g.key.did]?.handle} />
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="font-heading mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
