import { DidIdentity, DidLinks } from "@/components/did-identity";
import { Empty, ErrorNote, NeedsToken, PageHeader } from "@/components/manage-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getProfiles, type Profile } from "@/lib/bsky";
import { getWatchedDids, hasToken, type WatchedDid } from "@/lib/obelisk";
import { unwatchDidAction, watchDidAction } from "../actions";

export default async function WatchedPage() {
  const header = (
    <PageHeader title="Watched DIDs" description="Repos audited across every collection (full-repo backfill + forward capture)." />
  );
  if (!hasToken()) {
    return (
      <div className="space-y-6">
        {header}
        <NeedsToken />
      </div>
    );
  }

  let watched: WatchedDid[] = [];
  let profiles: Record<string, Profile> = {};
  let error: string | null = null;
  try {
    watched = (await getWatchedDids()).watchedDids;
    profiles = await getProfiles(watched.map((w) => w.did));
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div className="space-y-6">
      {header}
      {error && <ErrorNote message={error} />}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Watched</CardTitle>
          <CardDescription>Adding a DID enrolls it in the footprint Tab.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={watchDidAction} className="flex flex-wrap items-center gap-2">
            <Input name="did" placeholder="handle.bsky.social or did:plc:…" className="w-72" required />
            <Input name="note" placeholder="note (optional)" className="w-48" />
            <Button type="submit" size="sm">Watch</Button>
          </form>

          {watched.length === 0 ? (
            <Empty>No watched DIDs.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Repo</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Snapshot</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {watched.map((w) => (
                  <TableRow key={w.did}>
                    <TableCell>
                      <DidIdentity did={w.did} profile={profiles[w.did]} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{w.note ?? "—"}</TableCell>
                    <TableCell>
                      {w.snapshotAt ? (
                        <Badge variant="secondary" className="text-xs">snapshotted</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-xs">pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <DidLinks did={w.did} handle={profiles[w.did]?.handle} />
                        <form action={unwatchDidAction.bind(null, w.did)}>
                          <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                            Remove
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
    </div>
  );
}
