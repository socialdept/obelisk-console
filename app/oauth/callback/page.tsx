"use client";

import { finalizeAuthorization } from "@atcute/oauth-browser-client";
import { Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ensureOAuth } from "@/lib/oauth-client";

export default function CallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        ensureOAuth();
        // atproto returns params in the URL fragment.
        const params = new URLSearchParams(location.hash.slice(1));
        history.replaceState(null, "", location.pathname);

        const { session } = await finalizeAuthorization(params);
        const did = session.info.sub;
        const handle = sessionStorage.getItem("obk_login_handle") ?? undefined;
        sessionStorage.removeItem("obk_login_handle");

        const res = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ did, handle }),
        });

        if (cancelled) return;
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          setError(
            res.status === 403
              ? `${handle ?? did} is not an authorized operator.`
              : (body.error ?? "Sign-in failed."),
          );
          return;
        }
        window.location.assign("/");
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      {error ? (
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <XCircle className="text-destructive size-8" />
          <div>
            <p className="font-medium">Couldn&apos;t sign you in</p>
            <p className="text-muted-foreground mt-1 text-sm">{error}</p>
          </div>
          <Button variant="outline" onClick={() => window.location.assign("/login")}>
            Back to sign in
          </Button>
        </div>
      ) : (
        <div className="text-muted-foreground flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" /> Completing sign-in…
        </div>
      )}
    </div>
  );
}
