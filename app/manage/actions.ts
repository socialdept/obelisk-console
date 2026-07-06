"use server";

import { revalidatePath } from "next/cache";
import { getOperator } from "@/lib/auth";
import * as obk from "@/lib/obelisk";

async function guard() {
  if (!(await getOperator())) throw new Error("unauthorized");
}

// ── blocklists ───────────────────────────────────────────────────────
export async function blockDidAction(formData: FormData) {
  await guard();
  const did = String(formData.get("did") ?? "").trim();
  if (!did) return;
  await obk.addBlockedDid({
    did,
    note: String(formData.get("note") ?? "").trim() || undefined,
    purge: formData.get("purge") === "on",
    force: formData.get("force") === "on",
  });
  revalidatePath("/manage/blocklists");
}

export async function unblockDidAction(did: string) {
  await guard();
  await obk.removeBlockedDid(did);
  revalidatePath("/manage/blocklists");
}

export async function blockPdsAction(formData: FormData) {
  await guard();
  const pattern = String(formData.get("pattern") ?? "").trim();
  if (!pattern) return;
  await obk.addBlockedPds({ pattern, note: String(formData.get("note") ?? "").trim() || undefined });
  revalidatePath("/manage/blocklists");
}

export async function unblockPdsAction(pattern: string) {
  await guard();
  await obk.removeBlockedPds(pattern);
  revalidatePath("/manage/blocklists");
}

// ── watched DIDs ─────────────────────────────────────────────────────
export async function watchDidAction(formData: FormData) {
  await guard();
  const did = String(formData.get("did") ?? "").trim();
  if (!did) return;
  await obk.addWatchedDid({ did, note: String(formData.get("note") ?? "").trim() || undefined });
  revalidatePath("/manage/watched");
}

export async function unwatchDidAction(did: string) {
  await guard();
  await obk.removeWatchedDid(did);
  revalidatePath("/manage/watched");
}

// ── webhooks ─────────────────────────────────────────────────────────
export async function testWebhookAction(id: number) {
  await guard();
  await obk.testWebhook(id);
}

export async function deleteWebhookAction(id: number) {
  await guard();
  await obk.deleteWebhook(id);
  revalidatePath("/manage/webhooks");
}

// ── audiences ────────────────────────────────────────────────────────
export async function deleteAudienceAction(name: string) {
  await guard();
  await obk.deleteAudience(name);
  revalidatePath("/manage/audiences");
}
