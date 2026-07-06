"use client";

import { Loader2, Users } from "lucide-react";
import { useState } from "react";
import { DidIdentity, DidLinks } from "@/components/did-identity";
import { Empty } from "@/components/manage-ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Profile } from "@/lib/bsky";

export function AudienceMembersDialog({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [members, setMembers] = useState<string[] | null>(null);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [error, setError] = useState<string | null>(null);

  async function onOpen(o: boolean) {
    setOpen(o);
    if (o && members === null) {
      setBusy(true);
      const res = await fetch(`/api/audiences/members?name=${encodeURIComponent(name)}`);
      setBusy(false);
      if (res.ok) {
        const d = (await res.json()) as { members: string[]; profiles: Record<string, Profile> };
        setMembers(d.members);
        setProfiles(d.profiles ?? {});
      } else {
        setMembers([]);
        setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "failed to load");
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogTrigger render={<Button size="sm" variant="ghost" className="gap-1.5" />}>
        <Users className="size-3.5" /> Members
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Members of &ldquo;{name}&rdquo;</DialogTitle>
          <DialogDescription>
            {members ? `${members.length}${members.length >= 50 ? "+ (first 50)" : ""} resolved live from the definition` : "Resolving…"}
          </DialogDescription>
        </DialogHeader>
        {busy && (
          <div className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
            <Loader2 className="size-4 animate-spin" /> Resolving members…
          </div>
        )}
        {error && <p className="text-destructive text-sm">{error}</p>}
        {members && members.length === 0 && !error && <Empty>No members.</Empty>}
        <div className="space-y-1">
          {members?.map((did) => (
            <div key={did} className="hover:bg-muted/50 flex items-center justify-between gap-2 rounded-md px-1 py-1">
              <DidIdentity did={did} profile={profiles[did]} />
              <DidLinks did={did} handle={profiles[did]?.handle} />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
