"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/search", label: "Search" },
  { href: "/stats", label: "Stats" },
  { href: "/manage/blocklists", label: "Blocklists" },
  { href: "/manage/watched", label: "Watched" },
  { href: "/manage/webhooks", label: "Webhooks" },
  { href: "/manage/audiences", label: "Audiences" },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="flex items-center gap-1">
      {LINKS.map((l) => {
        const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-sm transition-colors",
              active ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
