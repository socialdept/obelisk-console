import { AppShell } from "@/components/app-shell";
import { NeedsToken, PageHeader } from "@/components/manage-ui";
import { SearchView } from "@/components/search-view";
import { requireOperator } from "@/lib/auth";
import { obeliskConfig } from "@/lib/config";
import { hasToken } from "@/lib/obelisk";

export default async function SearchPage() {
  const operator = await requireOperator();
  return (
    <AppShell obeliskUrl={obeliskConfig().url} operator={operator}>
      <div className="space-y-6">
        <PageHeader title="Search" description="Query the archive by keyword, meaning, footprint, or URI." />
        {hasToken() ? <SearchView /> : <NeedsToken />}
      </div>
    </AppShell>
  );
}
