"use client";

import { Loader2, RefreshCw } from "lucide-react";
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

export function ReindexDialog() {
  const [open, setOpen] = useState(false);
  const [actor, setActor] = useState("");
  const [all, setAll] = useState(false);
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!actor.trim()) return;
    setBusy(true);
    const res = await fetch("/api/reindex", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor: actor.trim(), all }),
    });
    setBusy(false);
    if (!res.ok) {
      const b = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error("Reindex failed", { description: b.error });
      return;
    }
    const d = (await res.json()) as { did: string; status: string; scope: string };
    toast.success(
      d.status === "already-running" ? "Already reindexing that repo" : `Reindexing ${d.did} (${d.scope})`,
      { description: d.status === "started" ? "Runs in the background — records land as they stream in." : undefined },
    );
    setOpen(false);
    setActor("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" className="gap-1.5" />}>
        <RefreshCw className="size-4" /> Reindex repo
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reindex a repo</DialogTitle>
          <DialogDescription>
            Pull a repo straight from its PDS to recover records the live sync missed — e.g. what a blocklist dropped.
            Idempotent, runs in the background. Bypasses the blocklist; honors the cold lists.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Actor</Label>
            <Input value={actor} onChange={(e) => setActor(e.target.value)} placeholder="actor" />
          </div>
          <label className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} className="accent-primary" />
            all collections (default: only the configured ones)
          </label>
        </div>
        <DialogFooter>
          <Button onClick={run} disabled={busy || !actor.trim()} className="gap-1.5">
            {busy && <Loader2 className="size-4 animate-spin" />} Reindex
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
