"use client";

import { Ban, Loader2 } from "lucide-react";
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

/** Block a repo (DID) with an optional note and purge/force of existing records. */
export function BlockDidDialog({ did }: { did: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [purge, setPurge] = useState(false);
  const [force, setForce] = useState(false);
  const [busy, setBusy] = useState(false);

  async function block() {
    setBusy(true);
    const res = await fetch("/api/blocklist/did", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor: did, note, purge, force }),
    });
    setBusy(false);
    if (!res.ok) {
      const b = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error("Block failed", { description: b.error });
      return;
    }
    const d = (await res.json()) as { purged?: number; mode?: string };
    toast.success(d.purged ? `Blocked and purged ${d.purged} record${d.purged === 1 ? "" : "s"}` : "Repo blocked");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" size="sm" variant="ghost" className="text-destructive gap-1.5" />}>
        <Ban className="size-3.5" /> Block
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Block repo?</DialogTitle>
          <DialogDescription className="font-mono text-xs break-all">{did}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Note</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="reason (optional)" />
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={purge} onChange={(e) => setPurge(e.target.checked)} className="accent-primary mt-0.5" />
            <span>
              Purge existing records <span className="text-muted-foreground">— soft-delete what&apos;s archived</span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={force}
              onChange={(e) => {
                setForce(e.target.checked);
                if (e.target.checked) setPurge(true);
              }}
              className="accent-destructive mt-0.5"
            />
            <span>
              Force <span className="text-muted-foreground">— hard-delete, permanent (implies purge)</span>
            </span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={block} disabled={busy} className="gap-1.5">
            {busy && <Loader2 className="size-4 animate-spin" />} Block
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
