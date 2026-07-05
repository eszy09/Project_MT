import "server-only";

import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { safeReturnTo } from "./redirects";

export async function getOptionalSession() {
  try {
    return await auth0.getSession();
  } catch {
    return null;
  }
}

export async function requireSession(returnTo = "/dashboard") {
  const session = await getOptionalSession();

  if (!session) {
    const destination = safeReturnTo(returnTo);
    redirect(`/auth/login?returnTo=${encodeURIComponent(destination)}`);
  }

  return session;
}
