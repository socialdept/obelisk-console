import { Empty, ErrorNote, NeedsToken, PageHeader } from "@/components/manage-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAudiences, hasToken, type Audience } from "@/lib/obelisk";
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

  return (
    <div className="space-y-6">
      {header}
      {error && <ErrorNote message={error} />}
      <Card>
        <CardContent className="py-4">
          {audiences.length === 0 ? (
            <Empty>No audiences. Define them via the archive API.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead className="w-24 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audiences.map((a) => (
                  <TableRow key={a.name}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{kindOf(a.definition)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <form action={deleteAudienceAction.bind(null, a.name)}>
                        <Button type="submit" size="sm" variant="ghost" className="text-destructive">Delete</Button>
                      </form>
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
