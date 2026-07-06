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

const EXAMPLE = `{
  "kind": "backlink",
  "target": "at://did:plc:…/site.standard.publication/self",
  "collection": "site.standard.graph.subscription",
  "path": "publication"
}`;

export function CreateAudienceDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [def, setDef] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    let definition: unknown;
    try {
      definition = JSON.parse(def);
    } catch {
      toast.error("Definition must be valid JSON");
      return;
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
      toast.error("Couldn't create audience", { description: b.error });
      return;
    }
    toast.success(`Audience "${name.trim()}" created`);
    setOpen(false);
    setName("");
    setDef("");
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
            <DialogDescription>
              A query over the archive — membership updates itself. Kinds: <code>backlink</code>, <code>outlink</code>,{" "}
              <code>collection</code>, <code>static</code>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="my-subscribers" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Definition (JSON)</Label>
              <textarea
                value={def}
                onChange={(e) => setDef(e.target.value)}
                placeholder={EXAMPLE}
                spellCheck={false}
                rows={9}
                required
                className="border-input bg-transparent w-full rounded-lg border p-3 font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
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
