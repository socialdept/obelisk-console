"use server";

import { revalidatePath } from "next/cache";
import { getOperator } from "@/lib/auth";
import { resolveActor } from "@/lib/bsky";
import * as obk from "@/lib/obelisk";

async function guard() {
  if (!(await getOperator())) throw new Error("unauthorized");
}

/** Accept a DID or a handle; resolve handles → DID. Throws on an unresolvable input. */
async function toDid(input: string): Promise<string> {
  const did = await resolveActor(input);
  if (!did) throw new Error(`Could not resolve "${input}" to a DID`);
  return did;
}

// ── blocklists ───────────────────────────────────────────────────────
export async function blockDidAction(formData: FormData) {
  await guard();
  const input = String(formData.get("did") ?? "").trim();
  if (!input) return;
  await obk.addBlockedDid({
    did: await toDid(input),
    note: String(formData.get("note") ?? "").trim() || undefined,
    purge: formData.get("purge") === "on",
    force: formData.get("force") === "on",
  });
  revalidatePath("/manage/exclusions");
}

export async function unblockDidAction(did: string) {
  await guard();
  await obk.removeBlockedDid(did);
  revalidatePath("/manage/exclusions");
}

export async function blockPdsAction(formData: FormData) {
  await guard();
  const pattern = String(formData.get("pattern") ?? "").trim();
  if (!pattern) return;
  await obk.addBlockedPds({ pattern, note: String(formData.get("note") ?? "").trim() || undefined });
  revalidatePath("/manage/exclusions");
}

export async function unblockPdsAction(pattern: string) {
  await guard();
  await obk.removeBlockedPds(pattern);
  revalidatePath("/manage/exclusions");
}

// ── cold storage ─────────────────────────────────────────────────────
export async function coldDidAction(formData: FormData) {
  await guard();
  const input = String(formData.get("did") ?? "").trim();
  if (!input) return;
  await obk.addColdDid({ did: await toDid(input), note: String(formData.get("note") ?? "").trim() || undefined });
  revalidatePath("/manage/exclusions");
}

export async function unColdDidAction(did: string) {
  await guard();
  await obk.removeColdDid(did);
  revalidatePath("/manage/exclusions");
}

export async function coldPdsAction(formData: FormData) {
  await guard();
  const pattern = String(formData.get("pattern") ?? "").trim();
  if (!pattern) return;
  await obk.addColdPds({ pattern, note: String(formData.get("note") ?? "").trim() || undefined });
  revalidatePath("/manage/exclusions");
}

export async function unColdPdsAction(pattern: string) {
  await guard();
  await obk.removeColdPds(pattern);
  revalidatePath("/manage/exclusions");
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
