import { Boxes } from "lucide-react";
import { OperatorMenu } from "@/components/operator-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";

/** Top-level authed chrome: brand, connected-archive badge, theme toggle, operator menu. */
export function AppShell({
  obeliskUrl,
  operator,
  children,
}: {
  obeliskUrl: string;
  operator: { did: string; handle?: string };
  children: React.ReactNode;
}) {
  const host = safeHost(obeliskUrl);

  return (
    <div className="flex min-h-full flex-col">
      <header className="bg-background/80 sticky top-0 z-30 border-b backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4">
          <Boxes className="text-primary h-5 w-5" />
          <span className="font-heading font-semibold tracking-tight">Obelisk Console</span>
          {host ? (
            <Badge variant="secondary" className="font-mono text-xs">
              {host}
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-xs">
              set OBELISK_API_URL
            </Badge>
          )}
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <OperatorMenu did={operator.did} handle={operator.handle} />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}

function safeHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}
