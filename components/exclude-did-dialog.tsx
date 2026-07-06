"use client";

import { CircleSlash, Loader2, Snowflake } from "lucide-react";
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
import { cn } from "@/lib/utils";

type Mode = "block" | "cool";

/** Exclude a repo (DID) — either block it (dropped) or cool it (archived, not embedded). */
export function ExcludeDidDialog({ did }: { did: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("block");
  const [note, setNote] = useState("");
  const [purge, setPurge] = useState(false);
  const [force, setForce] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const url = mode === "block" ? "/api/blocklist/did" : "/api/cold/did";
    const body = mode === "block" ? { actor: did, note, purge, force } : { actor: did, note };
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const b = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error(mode === "block" ? "Block failed" : "Cool failed", { description: b.error });
      return;
    }
    if (mode === "block") {
      const d = (await res.json()) as { purged?: number };
      toast.success(d.purged ? `Blocked and purged ${d.purged} record${d.purged === 1 ? "" : "s"}` : "Repo blocked");
    } else {
      const d = (await res.json()) as { cooled?: number; embeddingsPurged?: number };
      toast.success(`Cooled ${d.cooled ?? 0} record${d.cooled === 1 ? "" : "s"}`, {
        description: d.embeddingsPurged ? `Purged ${d.embeddingsPurged} embeddings to reclaim storage.` : undefined,
      });
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" size="sm" variant="ghost" className="gap-1.5" />}>
        <CircleSlash className="size-3.5" /> Exclude
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exclude repo</DialogTitle>
          <DialogDescription className="font-mono text-xs break-all">{did}</DialogDescription>
        </DialogHeader>

        {/* Mode selector */}
        <div className="grid grid-cols-2 gap-2">
          <ModeCard
            active={mode === "block"}
            onClick={() => setMode("block")}
            icon={<CircleSlash className="size-4" />}
            title="Block"
            desc="Dropped — never archived."
          />
          <ModeCard
            active={mode === "cool"}
            onClick={() => setMode("cool")}
            icon={<Snowflake className="size-4" />}
            title="Cool"
            desc="Archived, but not embedded."
          />
        </div>

        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label className="text-xs">Note</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="reason (optional)" />
          </div>
          {mode === "block" && (
            <>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={purge}
                  onChange={(e) => setPurge(e.target.checked)}
                  className="accent-primary mt-0.5"
                />
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
            </>
          )}
          {mode === "cool" && (
            <p className="text-muted-foreground text-sm">
              Existing records are flagged cold and their embeddings purged to reclaim storage. Reversible from the
              Exclusions page.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant={mode === "block" ? "destructive" : "default"}
            onClick={submit}
            disabled={busy}
            className="gap-1.5"
          >
            {busy && <Loader2 className="size-4 animate-spin" />} {mode === "block" ? "Block" : "Cool"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ModeCard({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border p-3 text-left transition-colors",
        active ? "border-primary bg-primary/5" : "hover:bg-muted/50",
      )}
    >
      <div className="flex items-center gap-1.5 text-sm font-medium">
        {icon} {title}
      </div>
      <p className="text-muted-foreground mt-1 text-xs">{desc}</p>
    </button>
  );
}
