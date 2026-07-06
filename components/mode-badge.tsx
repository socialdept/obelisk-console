"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface BackfillLike {
  backfillRatePerSec: number;
}

type Mode = "unknown" | "live" | "backfilling";

/** Topbar badge: is the archive still importing history, or caught up (live)? */
export function ModeBadge() {
  const [mode, setMode] = useState<Mode>("unknown");

  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const res = await fetch("/api/status", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (stop) return;
        if (!data.hasToken || !Array.isArray(data.backfill)) {
          setMode("unknown");
          return;
        }
        const backfilling = (data.backfill as BackfillLike[]).some((c) => c.backfillRatePerSec > 0);
        setMode(backfilling ? "backfilling" : "live");
      } catch {
        // keep last known mode
      }
    };
    load();
    const t = setInterval(load, 15_000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, []);

  if (mode === "unknown") return null;

  if (mode === "backfilling") {
    return (
      <Badge variant="outline" className="gap-1.5 border-amber-500/40 text-amber-600 dark:text-amber-400">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-500 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
        </span>
        Backfilling
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1.5 border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
      <span className="size-2 rounded-full bg-emerald-500" />
      Live
    </Badge>
  );
}
