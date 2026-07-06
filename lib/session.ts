import { getIronSession, type IronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionSecret } from "./config";

/** The operator's identity, stored in an httpOnly cookie. No tokens here. */
export interface OperatorSession {
  did?: string;
  handle?: string;
}

export async function getSession(): Promise<IronSession<OperatorSession>> {
  const password = sessionSecret();
  if (password.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 chars (openssl rand -hex 32)");
  }
  // Next 16: cookies() is async.
  const store = await cookies();
  return getIronSession<OperatorSession>(store, {
    password,
    cookieName: "obk_console",
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  });
}
