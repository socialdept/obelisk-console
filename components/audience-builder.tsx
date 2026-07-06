"use client";

import { AlertTriangle, Loader2, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { DidIdentity } from "@/components/did-identity";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Profile } from "@/lib/bsky";

const selectCls = "border-input bg-transparent h-8 w-full rounded-lg border px-2 text-sm";

const KINDS = [
  {
    value: "backlink",
    label: "backlink",
    help: "Everyone pointing AT a thing. Members are the repos whose records link to your target URI. Example: all subscribers of a publication — repos with a site.standard.graph.subscription whose publication field is your publication's URI. Narrow it with a collection and/or link path.",
  },
  {
    value: "outlink",
    label: "outlink",
    help: "Everyone one account points at. Members are the repos that a chosen account's records link to. Example: every publication a given user subscribes to, or everyone they recommend. Narrow it to which of their collections / link paths count.",
  },
  {
    value: "collection",
    label: "collection",
    help: "Everyone who has a certain kind of record. Members are the repos with at least one record in a collection — optionally only those whose record matches a field (e.g. content.$type = app.offprint.content). Example: everyone who has published a document.",
  },
  {
    value: "static",
    label: "static",
    help: "A fixed list. Members are exactly the accounts you paste in — no query, no auto-updating. Use it for a hand-picked set.",
  },
];

async function resolve(actor: string): Promise<string | null> {
  const a = actor.trim();
  if (!a) return null;
  if (a.startsWith("did:")) return a;
  const res = await fetch(`/api/resolve?actor=${encodeURIComponent(a)}`);
  return res.ok ? ((await res.json()).did as string) : null;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {label}
        {hint && <span className="text-muted-foreground ml-2 font-normal">{hint}</span>}
      </Label>
      {children}
    </div>
  );
}

interface Preview {
  loading: boolean;
  def?: Record<string, unknown>;
  count?: number;
  members?: string[];
  profiles?: Record<string, Profile>;
  error?: string;
  unsupported?: boolean;
}

export function AudienceBuilder({
  collections,
  onCreated,
  onCancel,
}: {
  collections: string[];
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState("backlink");
  const [target, setTarget] = useState("");
  const [did, setDid] = useState("");
  const [collection, setCollection] = useState("");
  const [path, setPath] = useState("");
  const [mPath, setMPath] = useState("");
  const [mValue, setMValue] = useState("");
  const [staticDids, setStaticDids] = useState("");
  const [preview, setPreview] = useState<Preview>({ loading: false });
  const [creating, setCreating] = useState(false);

  const buildDefinition = useCallback(async (): Promise<Record<string, unknown> | null> => {
    if (kind === "backlink") {
      return target.trim()
        ? { kind, target: target.trim(), collection: collection || undefined, path: path.trim() || undefined }
        : null;
    }
    if (kind === "outlink") {
      const d = await resolve(did);
      return d ? { kind, did: d, collection: collection || undefined, path: path.trim() || undefined } : null;
    }
    if (kind === "collection") {
      return collection
        ? { kind, collection, matchers: mPath.trim() && mValue.trim() ? { [mPath.trim()]: mValue.trim() } : undefined }
        : null;
    }
    const lines = staticDids.split("\n").map((s) => s.trim()).filter(Boolean);
    if (!lines.length) return null;
    const dids = (await Promise.all(lines.map(resolve))).filter(Boolean) as string[];
    return dids.length ? { kind, dids } : null;
  }, [kind, target, did, collection, path, mPath, mValue, staticDids]);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      const def = await buildDefinition();
      if (cancelled) return;
      if (!def) return setPreview({ loading: false });
      setPreview((p) => ({ ...p, loading: true, def }));
      const res = await fetch("/api/audiences/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ definition: def }),
      });
      if (cancelled) return;
      if (res.status === 501) return setPreview({ loading: false, def, unsupported: true });
      if (!res.ok) {
        return setPreview({ loading: false, def, error: ((await res.json().catch(() => ({}))) as { error?: string }).error });
      }
      const d = (await res.json()) as { count: number; members: string[]; profiles: Record<string, Profile> };
      setPreview({ loading: false, def, count: d.count, members: d.members, profiles: d.profiles });
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [buildDefinition]);

  async function create() {
    if (!name.trim()) return toast.error("Name is required");
    const def = await buildDefinition();
    if (!def) return toast.error("Complete the definition first");
    setCreating(true);
    const res = await fetch("/api/audiences/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: name.trim(), definition: def }),
    });
    setCreating(false);
    if (!res.ok) {
      return toast.error("Couldn't create audience", {
        description: ((await res.json().catch(() => ({}))) as { error?: string }).error,
      });
    }
    toast.success(`Audience "${name.trim()}" created`);
    onCreated();
  }

  const collectionSelect = (any = true) => (
    <select value={collection} onChange={(e) => setCollection(e.target.value)} className={`${selectCls} font-mono`} required={!any}>
      <option value="">{any ? "any collection" : "select…"}</option>
      {collections.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* editor */}
      <div className="space-y-4">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="my-subscribers" />
        </Field>
        <Field label="Kind">
          <div className="grid grid-cols-2 gap-2">
            {KINDS.map((k) => (
              <button
                key={k.value}
                type="button"
                onClick={() => setKind(k.value)}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  kind === k.value ? "border-primary bg-primary/5" : "hover:bg-accent"
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>
          <div className="bg-muted/50 text-muted-foreground rounded-md border p-3 text-xs leading-relaxed">
            {KINDS.find((k) => k.value === kind)?.help}
          </div>
        </Field>

        {kind === "backlink" && (
          <>
            <Field label="Target AT URI" hint="records linking to this">
              <Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="at://did:plc:…/…/self" className="font-mono" />
            </Field>
            <Field label="Collection">{collectionSelect()}</Field>
            <Field label="Link path" hint="optional">
              <Input value={path} onChange={(e) => setPath(e.target.value)} placeholder="publication" className="font-mono" />
            </Field>
          </>
        )}
        {kind === "outlink" && (
          <>
            <Field label="Actor" hint="whose records' links define membership">
              <Input value={did} onChange={(e) => setDid(e.target.value)} placeholder="actor" />
            </Field>
            <Field label="Collection">{collectionSelect()}</Field>
            <Field label="Link path" hint="optional">
              <Input value={path} onChange={(e) => setPath(e.target.value)} placeholder="document" className="font-mono" />
            </Field>
          </>
        )}
        {kind === "collection" && (
          <>
            <Field label="Collection" hint="required">{collectionSelect(false)}</Field>
            <Field label="Record matcher" hint="optional">
              <div className="flex gap-2">
                <Input value={mPath} onChange={(e) => setMPath(e.target.value)} placeholder="content.$type" className="font-mono" />
                <Input value={mValue} onChange={(e) => setMValue(e.target.value)} placeholder="app.offprint.content" className="font-mono" />
              </div>
            </Field>
          </>
        )}
        {kind === "static" && (
          <Field label="Actors" hint="one handle or DID per line">
            <textarea
              value={staticDids}
              onChange={(e) => setStaticDids(e.target.value)}
              rows={6}
              spellCheck={false}
              placeholder={"alice.bsky.social\ndid:plc:…"}
              className="border-input bg-transparent w-full rounded-lg border p-3 font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </Field>
        )}

        <div className="flex gap-2 pt-2">
          <Button onClick={create} disabled={creating} className="gap-1.5">
            {creating && <Loader2 className="size-4 animate-spin" />} Create audience
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>

      {/* live preview */}
      <Card className="bg-muted/30 h-fit">
        <CardContent className="space-y-4 py-4">
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-3xl font-semibold tabular-nums">
              {preview.loading ? "…" : (preview.count?.toLocaleString() ?? "—")}
            </span>
            <span className="text-muted-foreground text-sm">members</span>
            {preview.loading && <Loader2 className="text-muted-foreground size-4 animate-spin" />}
          </div>

          {preview.unsupported && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/5 p-2 text-xs">
              <AlertTriangle className="mt-0.5 size-3.5 text-amber-500" />
              <span>Live preview needs archive <span className="font-mono">v0.2.4+</span>. You can still create it.</span>
            </div>
          )}
          {preview.error && <p className="text-destructive text-xs">{preview.error}</p>}

          {preview.def && (
            <div>
              <p className="text-muted-foreground mb-1 text-xs">Definition</p>
              <pre className="bg-background overflow-auto rounded-md border p-2 text-[11px] leading-relaxed">
                {JSON.stringify(preview.def, null, 2)}
              </pre>
            </div>
          )}

          {preview.members && preview.members.length > 0 && (
            <div className="space-y-1">
              <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <Users className="size-3.5" /> Sample
              </p>
              <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                {preview.members.map((d) => (
                  <DidIdentity key={d} did={d} profile={preview.profiles?.[d]} />
                ))}
              </div>
              {(preview.count ?? 0) > preview.members.length && (
                <p className="text-muted-foreground pt-1 text-xs">
                  and {(preview.count! - preview.members.length).toLocaleString()} more…
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
