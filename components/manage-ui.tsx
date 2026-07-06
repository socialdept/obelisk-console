import { KeyRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

export function NeedsToken() {
  return (
    <Card className="border-amber-500/40 bg-amber-500/5">
      <CardContent className="flex items-center gap-3 py-4">
        <KeyRound className="size-5 text-amber-500" />
        <div className="text-sm">
          <p className="font-medium">No archive token configured</p>
          <p className="text-muted-foreground">
            Set <code className="font-mono">OBELISK_API_TOKEN</code> in the console&apos;s env to manage the archive.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <Card className="border-destructive/40 bg-destructive/5">
      <CardContent className="py-4 text-sm">
        <p className="font-medium">Couldn&apos;t reach the archive</p>
        <p className="text-muted-foreground font-mono text-xs">{message}</p>
      </CardContent>
    </Card>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground py-6 text-center text-sm">{children}</p>;
}
