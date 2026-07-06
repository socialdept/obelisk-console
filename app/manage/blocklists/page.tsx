import { Empty, ErrorNote, NeedsToken, PageHeader } from "@/components/manage-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  getBlockedDids,
  getBlockedPdses,
  hasToken,
  type BlockedDid,
  type BlockedPds,
} from "@/lib/obelisk";
import { blockDidAction, blockPdsAction, unblockDidAction, unblockPdsAction } from "../actions";

export default async function BlocklistsPage() {
  const header = (
    <PageHeader title="Blocklists" description="Repos and PDSes the archive refuses to ingest." />
  );

  if (!hasToken()) {
    return (
      <div className="space-y-6">
        {header}
        <NeedsToken />
      </div>
    );
  }

  let dids: BlockedDid[] = [];
  let pdses: BlockedPds[] = [];
  let error: string | null = null;
  try {
    [dids, pdses] = await Promise.all([
      getBlockedDids().then((r) => r.blockedDids),
      getBlockedPdses().then((r) => r.blockedPdses),
    ]);
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div className="space-y-6">
      {header}
      {error && <ErrorNote message={error} />}

      {/* Blocked DIDs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Blocked DIDs</CardTitle>
          <CardDescription>A blocked repo&apos;s events arrive from Tab but are never archived.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={blockDidAction} className="flex flex-wrap items-center gap-2">
            <Input name="did" placeholder="did:plc:…" className="w-64 font-mono" required />
            <Input name="note" placeholder="note (optional)" className="w-48" />
            <label className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <input type="checkbox" name="purge" className="accent-primary" /> purge
            </label>
            <label className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <input type="checkbox" name="force" className="accent-primary" /> force
            </label>
            <Button type="submit" size="sm">Block</Button>
          </form>

          {dids.length === 0 ? (
            <Empty>No blocked DIDs.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DID</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="w-24 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dids.map((d) => (
                  <TableRow key={d.did}>
                    <TableCell className="font-mono text-xs">{d.did}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{d.note ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <form action={unblockDidAction.bind(null, d.did)}>
                        <Button type="submit" size="sm" variant="ghost" className="text-muted-foreground">
                          Remove
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

      {/* Blocked PDSes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Blocked PDSes</CardTitle>
          <CardDescription>Wildcard patterns, e.g. <code className="font-mono">https://*.pds.host</code>. Future-block only.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={blockPdsAction} className="flex flex-wrap items-center gap-2">
            <Input name="pattern" placeholder="https://*.example.com" className="w-64 font-mono" required />
            <Input name="note" placeholder="note (optional)" className="w-48" />
            <Button type="submit" size="sm">Block</Button>
          </form>

          {pdses.length === 0 ? (
            <Empty>No blocked PDSes.</Empty>
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
                      <form action={unblockPdsAction.bind(null, p.pattern)}>
                        <Button type="submit" size="sm" variant="ghost" className="text-muted-foreground">
                          Remove
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
