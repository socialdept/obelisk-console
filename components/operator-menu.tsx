"use client";

import { LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function OperatorMenu({ did, handle }: { did: string; handle?: string }) {
  const label = handle ? `@${handle}` : shortDid(did);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/login");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <Button variant="ghost" size="sm" className="gap-2">
          <UserRound className="size-4" />
          <span className="max-w-[14ch] truncate font-mono text-xs">{label}</span>
        </Button>
      } />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-medium">{handle ? `@${handle}` : "Operator"}</p>
            <p className="text-muted-foreground truncate font-mono text-xs">{did}</p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function shortDid(did: string): string {
  return did.length > 20 ? `${did.slice(0, 12)}…${did.slice(-4)}` : did;
}
