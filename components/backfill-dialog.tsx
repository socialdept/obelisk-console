"use client";

import { History, Loader2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";

const selectCls = "border-input bg-transparent h-8 w-full rounded-lg border px-2 text-sm";

export function BackfillDialog() {
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState<string[]>([]);
  const [collection, setCollection] = useState("");
  const [busy, setBusy] = useState(false);

  async function onOpen(o: boolean) {
    setOpen(o);
    if (o && collections.length === 0) {
      const res = await fetch("/api/collections");
      if (res.ok) setCollections((await res.json()).collections ?? []);
    }
  }

  async function seed() {
    setBusy(true);
    const res = await fetch("/api/backfill", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ collection: collection || undefined }),
    });
    setBusy(false);
    if (!res.ok) {
      const b = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error("Backfill failed", { description: b.error });
      return;
    }
    const { seeded } = (await res.json()) as { seeded: number };
    toast.success(`Seeded ${seeded.toLocaleString()} event${seeded === 1 ? "" : "s"}`);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" className="gap-1.5" />}>
        <History className="size-4" /> Seed backfill
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Seed event backfill</DialogTitle>
          <DialogDescription>
            Emit synthetic events for archived records that predate the event log, so cursor/webhook consumers
            starting from the beginning see them. Idempotent.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 py-2">
          <Label className="text-xs">Collection</Label>
          <select value={collection} onChange={(e) => setCollection(e.target.value)} className={selectCls}>
            <option value="">all collections</option>
            {collections.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <DialogFooter>
          <Button onClick={seed} disabled={busy} className="gap-1.5">
            {busy && <Loader2 className="size-4 animate-spin" />} Seed events
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
