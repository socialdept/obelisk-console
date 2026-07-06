"use client";

import { Check, Copy, Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateWebhookDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function reset() {
    setSecret(null);
    setBusy(false);
    setCopied(false);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const csv = (k: string) =>
      String(fd.get(k) ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    const actions = ["create", "update", "delete"].filter((a) => fd.get(`action_${a}`) === "on");
    const path = String(fd.get("matcher_path") ?? "").trim();
    const value = String(fd.get("matcher_value") ?? "").trim();

    const body = {
      name: String(fd.get("name") ?? "").trim(),
      url: String(fd.get("url") ?? "").trim(),
      collections: csv("collections").length ? csv("collections") : undefined,
      actions: actions.length ? actions : undefined,
      from_cursor: fd.get("from_cursor") === "start" ? ("start" as const) : undefined,
      include_record: fd.get("include_record") === "on",
      record_matchers: path && value ? { [path]: value } : undefined,
      max_events: fd.get("max_events") ? Number(fd.get("max_events")) : undefined,
      max_wait_ms: fd.get("max_wait_ms") ? Number(fd.get("max_wait_ms")) : undefined,
    };

    setBusy(true);
    const res = await fetch("/api/webhooks/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const b = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error("Couldn't create webhook", { description: b.error });
      return;
    }
    const data = (await res.json()) as { webhook: { secret: string } };
    setSecret(data.webhook.secret);
    router.refresh();
  }

  async function copy() {
    if (!secret) return;
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    toast.success("Secret copied");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="size-4" /> New webhook
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        {secret ? (
          <>
            <DialogHeader>
              <DialogTitle>Webhook created</DialogTitle>
              <DialogDescription>
                Copy the signing secret now — it is <strong>shown only once</strong>. Verify deliveries with it.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2">
              <code className="bg-muted flex-1 rounded-md px-3 py-2 font-mono text-xs break-all">{secret}</code>
              <Button size="icon" variant="outline" onClick={copy} aria-label="Copy secret">
                {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>New webhook</DialogTitle>
              <DialogDescription>Deliver archive events to a URL as batched, HMAC-signed POSTs.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Field label="Name">
                <Input name="name" placeholder="my-app" required />
              </Field>
              <Field label="Delivery URL">
                <Input name="url" type="url" placeholder="https://app.example.com/hooks/obelisk" required />
              </Field>
              <Field label="Collections" hint="comma-separated; empty = all">
                <Input name="collections" placeholder="site.standard.document, site.standard.publication" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Actions" hint="empty = all">
                  <div className="flex gap-3 pt-1">
                    {["create", "update", "delete"].map((a) => (
                      <label key={a} className="text-muted-foreground flex items-center gap-1.5 text-sm">
                        <input type="checkbox" name={`action_${a}`} className="accent-primary" /> {a}
                      </label>
                    ))}
                  </div>
                </Field>
                <Field label="Start from">
                  <select
                    name="from_cursor"
                    defaultValue="now"
                    className="border-input bg-transparent h-8 rounded-lg border px-2 text-sm"
                  >
                    <option value="now">now (new events)</option>
                    <option value="start">start (all history)</option>
                  </select>
                </Field>
              </div>
              <Field label="Record matcher" hint="optional — path & value on the record body">
                <div className="flex gap-2">
                  <Input name="matcher_path" placeholder="content.$type" className="font-mono" />
                  <Input name="matcher_value" placeholder="app.offprint.content" className="font-mono" />
                </div>
              </Field>
              <div className="grid grid-cols-3 items-end gap-4">
                <label className="text-muted-foreground col-span-1 flex items-center gap-1.5 text-sm">
                  <input type="checkbox" name="include_record" defaultChecked className="accent-primary" /> include record
                </label>
                <Field label="Max events">
                  <Input name="max_events" type="number" placeholder="200" />
                </Field>
                <Field label="Max wait (ms)">
                  <Input name="max_wait_ms" type="number" placeholder="5000" />
                </Field>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={busy} className="gap-1.5">
                {busy && <Loader2 className="size-4 animate-spin" />} Create
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {label}
        {hint && <span className="text-muted-foreground ml-2 font-normal">{hint}</span>}
      </Label>
      {children}
    </div>
  );
}
