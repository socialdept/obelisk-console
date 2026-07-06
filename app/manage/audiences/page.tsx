import { AudienceBuilderModal } from "@/components/audience-builder-modal";
import { AudienceMembersDialog } from "@/components/audience-members-dialog";
import { ConfirmButton } from "@/components/confirm-button";
import { Empty, ErrorNote, NeedsToken, PageHeader } from "@/components/manage-ui";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAudiences, hasToken, listCollections, type Audience } from "@/lib/obelisk";
import { deleteAudienceAction } from "../actions";

function kindOf(def: unknown): string {
  return (def as { kind?: string })?.kind ?? "—";
}

export default async function AudiencesPage() {
  const header = (
    <PageHeader title="Audiences" description="Query-defined DID sets — membership updates itself as the network changes." />
  );
  if (!hasToken()) {
    return (
      <div className="space-y-6">
        {header}
        <NeedsToken />
      </div>
    );
  }

  let audiences: Audience[] = [];
  let error: string | null = null;
  try {
    audiences = (await getAudiences()).audiences;
  } catch (e) {
    error = (e as Error).message;
  }
  const collections = await listCollections().catch(() => []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        {header}
        <AudienceBuilderModal collections={collections} />
      </div>
      {error && <ErrorNote message={error} />}
      <Card>
        <CardContent className="py-4">
          {audiences.length === 0 ? (
            <Empty>No audiences yet — create one above.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audiences.map((a) => (
                  <TableRow key={a.name}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{kindOf(a.definition)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <AudienceMembersDialog name={a.name} definition={a.definition} />
                        <AudienceBuilderModal collections={collections} initial={{ name: a.name, definition: a.definition }} />
                        <ConfirmButton
                          action={deleteAudienceAction.bind(null, a.name)}
                          label="Delete"
                          confirmLabel="Delete"
                          title="Delete audience?"
                          description={`"${a.name}" will be removed. Subscriptions/feeds referencing it stop resolving.`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
