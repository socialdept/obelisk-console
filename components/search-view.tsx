"use client";

import { Loader2, Search } from "lucide-react";
import { useState } from "react";
import { DidIdentity, DidLinks } from "@/components/did-identity";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty } from "@/components/manage-ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Profile } from "@/lib/bsky";
import type { Footprint, SearchRecord } from "@/lib/obelisk";

const selectCls = "border-input bg-transparent h-8 rounded-lg border px-2 text-sm";
const num = (n: number, d = 0) => n.toLocaleString(undefined, { maximumFractionDigits: d });

function title(r: SearchRecord): string {
  const v = r.value as { title?: string; name?: string } | null;
  return v?.title || v?.name || r.uri.split("/").pop() || r.uri;
}

export function SearchView() {
  return (
    <Tabs defaultValue="records" className="space-y-4">
      <TabsList>
        <TabsTrigger value="records">Records</TabsTrigger>
        <TabsTrigger value="footprint">DID footprint</TabsTrigger>
        <TabsTrigger value="record">Record by URI</TabsTrigger>
      </TabsList>
      <TabsContent value="records">
        <RecordsSearch />
      </TabsContent>
      <TabsContent value="footprint">
        <FootprintSearch />
      </TabsContent>
      <TabsContent value="record">
        <RecordLookup />
      </TabsContent>
    </Tabs>
  );
}

// ── Records: keyword / semantic / hybrid ─────────────────────────────
function RecordsSearch() {
  const [collection, setCollection] = useState("site.standard.document");
  const [q, setQ] = useState("");
  const [mode, setMode] = useState("fts");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<SearchRecord[] | null>(null);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ collection: collection.trim(), q: q.trim(), mode, limit: 25 }),
    });
    setBusy(false);
    if (!res.ok) {
      setRecords(null);
      setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "search failed");
      return;
    }
    const data = (await res.json()) as { records: SearchRecord[]; profiles: Record<string, Profile> };
    setRecords(data.records);
    setProfiles(data.profiles ?? {});
  }

  return (
    <div className="space-y-4">
      <form onSubmit={run} className="flex flex-wrap items-end gap-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Collection</Label>
          <Input value={collection} onChange={(e) => setCollection(e.target.value)} className="w-64 font-mono" />
        </div>
        <div className="flex-1 space-y-1.5" style={{ minWidth: 220 }}>
          <Label className="text-xs">Query</Label>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="atproto" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Mode</Label>
          <select value={mode} onChange={(e) => setMode(e.target.value)} className={selectCls}>
            <option value="fts">keyword</option>
            <option value="semantic">semantic</option>
            <option value="hybrid">hybrid</option>
          </select>
        </div>
        <Button type="submit" disabled={busy} className="gap-1.5">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />} Search
        </Button>
      </form>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {records && records.length === 0 && <Empty>No matches.</Empty>}
      {records && records.length > 0 && (
        <div className="space-y-2">
          {records.map((r) => (
            <Card key={r.uri}>
              <CardContent className="space-y-2 py-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{title(r)}</p>
                  <div className="flex shrink-0 items-center gap-2">
                    {r.score !== undefined && <Badge variant="outline" className="text-xs">score {num(r.score, 2)}</Badge>}
                    {r.distance !== undefined && <Badge variant="outline" className="text-xs">dist {num(r.distance, 3)}</Badge>}
                    {r.rank !== undefined && <Badge variant="outline" className="text-xs">rank {num(r.rank, 3)}</Badge>}
                  </div>
                </div>
                {r.highlight && (
                  <p
                    className="text-muted-foreground text-sm [&_mark]:bg-primary/20 [&_mark]:text-foreground [&_mark]:rounded [&_mark]:px-0.5"
                    dangerouslySetInnerHTML={{ __html: r.highlight }}
                  />
                )}
                <div className="flex items-center justify-between gap-2">
                  <DidIdentity did={r.did} profile={profiles[r.did]} />
                  <DidLinks did={r.did} handle={profiles[r.did]?.handle} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── DID footprint ────────────────────────────────────────────────────
function FootprintSearch() {
  const [actor, setActor] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ footprint: Footprint; profile?: Profile } | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!actor.trim()) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/footprint?actor=${encodeURIComponent(actor.trim())}`);
    setBusy(false);
    if (!res.ok) {
      setData(null);
      setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "lookup failed");
      return;
    }
    setData(await res.json());
  }

  return (
    <div className="space-y-4">
      <form onSubmit={run} className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <Label className="text-xs">Actor</Label>
          <Input value={actor} onChange={(e) => setActor(e.target.value)} placeholder="actor" />
        </div>
        <Button type="submit" disabled={busy} className="gap-1.5">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />} Look up
        </Button>
      </form>
      {error && <p className="text-destructive text-sm">{error}</p>}
      {data && (
        <Card>
          <CardContent className="space-y-4 py-4">
            <div className="flex items-center justify-between gap-2">
              <DidIdentity did={data.footprint.did} profile={data.profile} />
              <DidLinks did={data.footprint.did} handle={data.profile?.handle} />
            </div>
            <div className="flex gap-6 text-sm">
              <span>
                <span className="font-heading text-lg font-semibold">{num(data.footprint.totals.records)}</span> records
              </span>
              <span>
                <span className="font-heading text-lg font-semibold">{num(data.footprint.totals.deleted)}</span> deleted
              </span>
              {data.footprint.watched && <Badge variant="secondary">watched</Badge>}
            </div>
            {data.footprint.collections.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Collection</TableHead>
                    <TableHead className="text-right">Records</TableHead>
                    <TableHead className="text-right">Deleted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.footprint.collections.map((c) => (
                    <TableRow key={c.collection}>
                      <TableCell className="font-mono text-xs">{c.collection}</TableCell>
                      <TableCell className="text-right tabular-nums">{num(c.count)}</TableCell>
                      <TableCell className="text-right tabular-nums">{num(c.deleted)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Record by AT URI ─────────────────────────────────────────────────
function RecordLookup() {
  const [uri, setUri] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ record: SearchRecord; profile?: Profile } | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!uri.trim()) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/record?uri=${encodeURIComponent(uri.trim())}`);
    setBusy(false);
    if (!res.ok) {
      setData(null);
      setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "not found");
      return;
    }
    setData(await res.json());
  }

  return (
    <div className="space-y-4">
      <form onSubmit={run} className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <Label className="text-xs">AT URI</Label>
          <Input value={uri} onChange={(e) => setUri(e.target.value)} placeholder="at://did:plc:…/site.standard.document/…" className="font-mono" />
        </div>
        <Button type="submit" disabled={busy} className="gap-1.5">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />} Fetch
        </Button>
      </form>
      {error && <p className="text-destructive text-sm">{error}</p>}
      {data && (
        <Card>
          <CardContent className="space-y-3 py-4">
            <div className="flex items-center justify-between gap-2">
              <DidIdentity did={data.record.did} profile={data.profile} />
              <DidLinks did={data.record.did} handle={data.profile?.handle} />
            </div>
            <div className="text-muted-foreground font-mono text-xs break-all">{data.record.uri}</div>
            <pre className="bg-muted max-h-[420px] overflow-auto rounded-md p-3 text-xs">
              {JSON.stringify(data.record.value, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
