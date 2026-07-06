"use client";

import { Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AudienceBuilder } from "@/components/audience-builder";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AudienceBuilderModal({
  collections,
  initial,
}: {
  collections: string[];
  /** When present, the modal edits this audience instead of creating a new one. */
  initial?: { name: string; definition: unknown };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const editing = Boolean(initial);

  const trigger = editing ? (
    <Button size="sm" variant="ghost" className="gap-1.5">
      <Pencil className="size-3.5" /> Edit
    </Button>
  ) : (
    <Button size="sm" className="gap-1.5">
      <Plus className="size-4" /> New audience
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit "${initial!.name}"` : "New audience"}</DialogTitle>
          <DialogDescription>Build a self-updating DID set — members preview live on the right.</DialogDescription>
        </DialogHeader>
        {/* Remount on open so edits start from the saved definition each time. */}
        {open && (
          <AudienceBuilder
            collections={collections}
            initial={initial}
            onCreated={() => {
              setOpen(false);
              router.refresh();
            }}
            onCancel={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
