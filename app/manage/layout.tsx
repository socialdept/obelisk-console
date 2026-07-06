import { AppShell } from "@/components/app-shell";
import { requireOperator } from "@/lib/auth";
import { obeliskConfig } from "@/lib/config";

export default async function ManageLayout({ children }: { children: React.ReactNode }) {
  const operator = await requireOperator();
  return (
    <AppShell obeliskUrl={obeliskConfig().url} operator={operator}>
      {children}
    </AppShell>
  );
}
