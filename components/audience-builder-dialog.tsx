"use client";

import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const selectCls = "border-input bg-transparent h-8 w-full rounded-lg border px-2 text-sm";

const KINDS = [
  { value: "backlink", label: "backlink — repos linking TO a target" },
  { value: "outlink", label: "outlink — repos an account links to" },
  { value: "collection", label: "collection — repos with records in a collection" },
  { value: "static", label: "static — an explicit DID list" },
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

export function AudienceBuilderDialog({ collections }: { collections: string[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState("backlink");
  const [target, setTarget] = useState("");
  const [did, setDid] = useState("");
  const [collection, setCollection] = useState("");
  const [path, setPath] = useState("");
  const [mPath, setMPath] = useState("");
  const [mValue, setMValue] = useState("");
  const [staticDids, setStaticDids] = useState("");

  const collectionSelect = (
    <select value={collection} onChange={(e) => setCollection(e.target.value)} className={`${selectCls} font-mono`}>
      <option value="">any collection</option>
      {collections.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    let definition: Record<string, unknown> | null = null;

    if (kind === "backlink") {
      if (!target.trim()) return toast.error("Target AT URI is required");
      definition = { kind, target: target.trim(), collection: collection || undefined, path: path.trim() || undefined };
    } else if (kind === "outlink") {
      const d = await resolve(did);
      if (!d) return toast.error(`Could not resolve "${did}"`);
      definition = { kind, did: d, collection: collection || undefined, path: path.trim() || undefined };
    } else if (kind === "collection") {
      if (!collection) return toast.error("Collection is required");
      definition = {
        kind,
        collection,
        matchers: mPath.trim() && mValue.trim() ? { [mPath.trim()]: mValue.trim() } : undefined,
      };
    } else if (kind === "static") {
      const lines = staticDids.split("\n").map((s) => s.trim()).filter(Boolean);
      const resolved = (await Promise.all(lines.map(resolve))).filter(Boolean) as string[];
      if (resolved.length === 0) return toast.error("No resolvable actors");
      definition = { kind, dids: resolved };
    }

    setBusy(true);
    const res = await fetch("/api/audiences/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: name.trim(), definition }),
    });
    setBusy(false);
    if (!res.ok) {
      const b = (await res.json().catch(() => ({}))) as { error?: string };
      return toast.error("Couldn't create audience", { description: b.error });
    }
    toast.success(`Audience "${name.trim()}" created`);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="size-4" /> New audience
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>New audience</DialogTitle>
            <DialogDescription>A self-updating query over the archive — membership tracks the network.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Field label="Name">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="my-subscribers" required />
            </Field>
            <Field label="Kind">
              <select value={kind} onChange={(e) => setKind(e.target.value)} className={selectCls}>
                {KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </Field>

            {kind === "backlink" && (
              <>
                <Field label="Target AT URI" hint="records linking to this">
                  <Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="at://did:plc:…/site.standard.publication/self" className="font-mono" />
                </Field>
                <Field label="Collection">{collectionSelect}</Field>
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
                <Field label="Collection">{collectionSelect}</Field>
                <Field label="Link path" hint="optional">
                  <Input value={path} onChange={(e) => setPath(e.target.value)} placeholder="document" className="font-mono" />
                </Field>
              </>
            )}

            {kind === "collection" && (
              <>
                <Field label="Collection" hint="required">
                  <select value={collection} onChange={(e) => setCollection(e.target.value)} className={`${selectCls} font-mono`} required>
                    <option value="">select…</option>
                    {collections.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Record matcher" hint="optional — path & value">
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
                  rows={5}
                  spellCheck={false}
                  placeholder={"alice.bsky.social\ndid:plc:…"}
                  className="border-input bg-transparent w-full rounded-lg border p-3 font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </Field>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy} className="gap-1.5">
              {busy && <Loader2 className="size-4 animate-spin" />} Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
