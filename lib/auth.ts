import { redirect } from "next/navigation";
import { operatorDids } from "./config";
import { getSession } from "./session";

export interface Operator {
  did: string;
  handle?: string;
}

/** The current operator if a valid, allowlisted session exists — else null. */
export async function getOperator(): Promise<Operator | null> {
  const session = await getSession();
  if (!session.did) return null;
  // Re-check the allowlist on every request — revoking a DID takes effect immediately.
  if (!operatorDids().includes(session.did)) return null;
  return { did: session.did, handle: session.handle };
}

/** Guard for server components / pages: redirects to /login unless authed. */
export async function requireOperator(): Promise<Operator> {
  const operator = await getOperator();
  if (!operator) redirect("/login");
  return operator;
}
