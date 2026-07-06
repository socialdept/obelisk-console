import { ConfirmButton } from "@/components/confirm-button";
import { DidIdentity, DidLinks } from "@/components/did-identity";
import { Empty, ErrorNote, NeedsToken, PageHeader } from "@/components/manage-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getProfiles, type Profile } from "@/lib/bsky";
import {
  getBlockedDids,
  getBlockedPdses,
  getColdDids,
  getColdPdses,
  hasToken,
  type BlockedDid,
  type BlockedPds,
  type ColdDid,
  type ColdPds,
} from "@/lib/obelisk";
import {
  blockDidAction,
  blockPdsAction,
  coldDidAction,
  coldPdsAction,
  unblockDidAction,
  unblockPdsAction,
  unColdDidAction,
  unColdPdsAction,
} from "../actions";

function SectionLabel({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1 border-b pb-2">
      <h2 className="font-heading text-lg font-semibold">{title}</h2>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

export default async function ExclusionsPage() {
  const header = (
    <PageHeader
      title="Exclusions"
      description="Per-repo and per-PDS rules for how the archive treats a source — dropped entirely, or kept but not embedded."
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

  let blockedDids: BlockedDid[] = [];
  let blockedPdses: BlockedPds[] = [];
  let coldDids: ColdDid[] = [];
  let coldPdses: ColdPds[] = [];
  let profiles: Record<string, Profile> = {};
  let error: string | null = null;
  try {
    [blockedDids, blockedPdses, coldDids, coldPdses] = await Promise.all([
      getBlockedDids().then((r) => r.blockedDids),
      getBlockedPdses().then((r) => r.blockedPdses),
      getColdDids().then((r) => r.coldDids),
      getColdPdses().then((r) => r.coldPdses),
    ]);
    profiles = await getProfiles([...blockedDids.map((d) => d.did), ...coldDids.map((d) => d.did)]);
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div className="space-y-8">
      {header}
      {error && <ErrorNote message={error} />}

      {/* ── Blocked: never archived ─────────────────────────────── */}
      <section className="space-y-4">
        <SectionLabel
          title="Blocked"
          description="A blocked repo or PDS is dropped — its events arrive from Tab but are never archived."
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Blocked DIDs</CardTitle>
            <CardDescription>
              <code className="font-mono">purge</code> soft-deletes existing records; <code className="font-mono">force</code>{" "}
              hard-deletes them (cascades, irreversible).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={blockDidAction} className="flex flex-wrap items-center gap-2">
              <Input name="did" placeholder="actor" className="w-72" required />
              <Input name="note" placeholder="note (optional)" className="w-48" />
              <label className="text-muted-foreground flex items-center gap-1.5 text-sm">
                <input type="checkbox" name="purge" className="accent-primary" /> purge
              </label>
              <label className="text-muted-foreground flex items-center gap-1.5 text-sm">
                <input type="checkbox" name="force" className="accent-primary" /> force
              </label>
              <Button type="submit" size="sm">Block</Button>
            </form>

            {blockedDids.length === 0 ? (
              <Empty>No blocked DIDs.</Empty>
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
                  {blockedDids.map((d) => (
                    <TableRow key={d.did}>
                      <TableCell>
                        <DidIdentity did={d.did} profile={profiles[d.did]} />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{d.note ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <DidLinks did={d.did} handle={profiles[d.did]?.handle} />
                          <form action={unblockDidAction.bind(null, d.did)}>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Blocked PDSes</CardTitle>
            <CardDescription>
              Wildcard patterns, e.g. <code className="font-mono">https://*.pds.host</code>. Future-block only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={blockPdsAction} className="flex flex-wrap items-center gap-2">
              <Input name="pattern" placeholder="https://*.example.com" className="w-64 font-mono" required />
              <Input name="note" placeholder="note (optional)" className="w-48" />
              <Button type="submit" size="sm">Block</Button>
            </form>

            {blockedPdses.length === 0 ? (
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
                  {blockedPdses.map((p) => (
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
      </section>

      {/* ── Cold storage: archived, not embedded ────────────────── */}
      <section className="space-y-4">
        <SectionLabel
          title="Cold storage"
          description="Kept and keyword-searchable, but never embedded — full records, no vector cost. Hidden from search by default."
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cold DIDs</CardTitle>
            <CardDescription>
              Cooling a repo flags its existing records and purges their embeddings to reclaim storage. Warming up
              re-queues them for embedding.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={coldDidAction} className="flex flex-wrap items-center gap-2">
              <Input name="did" placeholder="actor" className="w-72" required />
              <Input name="note" placeholder="note (optional)" className="w-48" />
              <Button type="submit" size="sm">Cool</Button>
            </form>

            {coldDids.length === 0 ? (
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
                  {coldDids.map((d) => (
                    <TableRow key={d.did}>
                      <TableCell>
                        <DidIdentity did={d.did} profile={profiles[d.did]} />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{d.note ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <DidLinks did={d.did} handle={profiles[d.did]?.handle} />
                          <ConfirmButton
                            action={unColdDidAction.bind(null, d.did)}
                            label="Warm up"
                            confirmLabel="Warm up"
                            variant="default"
                            title="Warm up repo?"
                            description="Its records will be re-queued for embedding — spending the CPU/$ you saved by cooling it."
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

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

            {coldPdses.length === 0 ? (
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
                  {coldPdses.map((p) => (
                    <TableRow key={p.pattern}>
                      <TableCell className="font-mono text-xs">{p.pattern}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{p.note ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <ConfirmButton
                          action={unColdPdsAction.bind(null, p.pattern)}
                          label="Warm up"
                          confirmLabel="Warm up"
                          variant="default"
                          title="Warm up PDS?"
                          description="New records from this PDS will be embedded again. Already-archived cold records for it stay cold."
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
