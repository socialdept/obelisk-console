"use client";

import type { ActorIdentifier } from "@atcute/lexicons";
import { createAuthorizationUrl } from "@atcute/oauth-browser-client";
import { Boxes, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ensureOAuth, OAUTH_SCOPE } from "@/lib/oauth-client";

export default function LoginPage() {
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    const identifier = handle.trim().replace(/^@/, "");
    if (!identifier) return;

    setBusy(true);
    try {
      ensureOAuth();
      // Carry the handle across the redirect so we can display it after login.
      sessionStorage.setItem("obk_login_handle", identifier);
      const url = await createAuthorizationUrl({
        target: { type: "account", identifier: identifier as ActorIdentifier },
        scope: OAUTH_SCOPE,
      });
      await new Promise((r) => setTimeout(r, 200)); // let storage flush
      window.location.assign(url.toString());
    } catch (err) {
      setBusy(false);
      toast.error("Could not start sign-in", {
        description: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="bg-primary/10 text-primary mb-2 flex size-11 items-center justify-center rounded-xl">
            <Boxes className="size-6" />
          </div>
          <CardTitle>Obelisk Console</CardTitle>
          <CardDescription>Sign in with your atproto account to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={signIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="handle">Handle</Label>
              <Input
                id="handle"
                placeholder="you.bsky.social"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                disabled={busy}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy || !handle.trim()}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              Continue with atproto
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
