"use client";

import { Loader2 } from "lucide-react";
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
} from "@/components/ui/dialog";

/**
 * A trigger button that confirms before invoking a (bound) server action.
 * Use for irreversible operations — delete, hard-purge, etc.
 */
export function ConfirmButton({
  action,
  label,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "destructive",
}: {
  action: () => Promise<unknown>;
  label: string;
  title: string;
  description: string;
  confirmLabel?: string;
  /** Confirm styling. `destructive` (default) for irreversible ops; `default` for reversible ones. */
  variant?: "destructive" | "default";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await action();
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error("Action failed", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={variant === "destructive" ? "text-destructive" : "text-muted-foreground"}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant={variant} onClick={confirm} disabled={busy} className="gap-1.5">
              {busy && <Loader2 className="size-4 animate-spin" />} {confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
