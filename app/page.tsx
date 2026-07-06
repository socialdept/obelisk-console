import { AppShell } from "@/components/app-shell";
import { Dashboard } from "@/components/dashboard";
import { requireOperator } from "@/lib/auth";
import { obeliskConfig } from "@/lib/config";

export default async function Home() {
  const operator = await requireOperator();
  const { url } = obeliskConfig();

  return (
    <AppShell obeliskUrl={url} operator={operator}>
      <Dashboard />
    </AppShell>
  );
}
