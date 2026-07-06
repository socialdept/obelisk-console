import { CreateWebhookDialog } from "@/components/create-webhook-dialog";
import { Empty, ErrorNote, NeedsToken, PageHeader } from "@/components/manage-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getWebhooks, hasToken, type Webhook } from "@/lib/obelisk";
import { deleteWebhookAction, testWebhookAction } from "../actions";

export default async function WebhooksPage() {
  const header = (
    <PageHeader title="Webhooks" description="Batched HMAC-signed event subscriptions delivered by the archive." />
  );
  if (!hasToken()) {
    return (
      <div className="space-y-6">
        {header}
        <NeedsToken />
      </div>
    );
  }

  let hooks: Webhook[] = [];
  let error: string | null = null;
  try {
    hooks = (await getWebhooks()).webhooks;
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        {header}
        <CreateWebhookDialog />
      </div>
      {error && <ErrorNote message={error} />}
      <Card>
        <CardContent className="py-4">
          {hooks.length === 0 ? (
            <Empty>No webhook subscriptions yet — create one above.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Fails</TableHead>
                  <TableHead className="w-40 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hooks.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">{h.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[22ch] truncate font-mono text-xs">{h.url}</TableCell>
                    <TableCell>
                      <Badge variant={h.status === "active" ? "secondary" : "outline"} className="text-xs">
                        {h.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{h.failureCount}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <form action={testWebhookAction.bind(null, h.id)}>
                          <Button type="submit" size="sm" variant="ghost">Test</Button>
                        </form>
                        <form action={deleteWebhookAction.bind(null, h.id)}>
                          <Button type="submit" size="sm" variant="ghost" className="text-destructive">Delete</Button>
                        </form>
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
