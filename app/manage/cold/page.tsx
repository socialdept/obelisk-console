import { DidIdentity, DidLinks } from "@/components/did-identity";
import { Empty, ErrorNote, NeedsToken, PageHeader } from "@/components/manage-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getProfiles, type Profile } from "@/lib/bsky";
import { getColdDids, getColdPdses, hasToken, type ColdDid, type ColdPds } from "@/lib/obelisk";
import { coldDidAction, coldPdsAction, unColdDidAction, unColdPdsAction } from "../actions";

export default async function ColdPage() {
  const header = (
    <PageHeader
      title="Cold storage"
      description="Repos and PDSes the archive keeps and indexes, but never embeds — full records, keyword-searchable, no vector cost. Hidden from search by default."
    />
  );

  if (!hasToken()) {
    return (
      <div className="space-y-6">
        {header}
        <NeedsToken />
      </div>
    );
  }

  let dids: ColdDid[] = [];
  let pdses: ColdPds[] = [];
  let profiles: Record<string, Profile> = {};
  let error: string | null = null;
  try {
    [dids, pdses] = await Promise.all([
      getColdDids().then((r) => r.coldDids),
      getColdPdses().then((r) => r.coldPdses),
    ]);
    profiles = await getProfiles(dids.map((d) => d.did));
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div className="space-y-6">
      {header}
      {error && <ErrorNote message={error} />}

      {/* Cold DIDs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cold DIDs</CardTitle>
          <CardDescription>
            Cooling a repo flags its existing records and purges their embeddings to reclaim storage. Un-cooling
            re-queues them for embedding.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={coldDidAction} className="flex flex-wrap items-center gap-2">
            <Input name="did" placeholder="actor" className="w-72" required />
            <Input name="note" placeholder="note (optional)" className="w-48" />
            <Button type="submit" size="sm">Cool</Button>
          </form>

          {dids.length === 0 ? (
            <Empty>No cold DIDs.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Repo</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dids.map((d) => (
                  <TableRow key={d.did}>
                    <TableCell>
                      <DidIdentity did={d.did} profile={profiles[d.did]} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{d.note ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <DidLinks did={d.did} handle={profiles[d.did]?.handle} />
                        <form action={unColdDidAction.bind(null, d.did)}>
                          <Button type="submit" size="sm" variant="ghost" className="text-muted-foreground">
                            Warm up
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cold PDSes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cold PDSes</CardTitle>
          <CardDescription>
            Wildcard patterns, e.g. <code className="font-mono">https://*.pds.host</code>. Forward-only — cools new
            records from matching hosts; already-archived records aren&apos;t retroactively swept.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={coldPdsAction} className="flex flex-wrap items-center gap-2">
            <Input name="pattern" placeholder="https://*.example.com" className="w-64 font-mono" required />
            <Input name="note" placeholder="note (optional)" className="w-48" />
            <Button type="submit" size="sm">Cool</Button>
          </form>

          {pdses.length === 0 ? (
            <Empty>No cold PDSes.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pattern</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="w-24 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pdses.map((p) => (
                  <TableRow key={p.pattern}>
                    <TableCell className="font-mono text-xs">{p.pattern}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{p.note ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <form action={unColdPdsAction.bind(null, p.pattern)}>
                        <Button type="submit" size="sm" variant="ghost" className="text-muted-foreground">
                          Warm up
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
