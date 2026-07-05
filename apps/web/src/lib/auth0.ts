import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { NextResponse } from "next/server";
import { safeReturnTo } from "@/features/auth/redirects";

const hour = 60 * 60;

export const auth0 = new Auth0Client({
  authorizationParameters: {
    scope: process.env.AUTH0_SCOPE ?? "openid profile email",
    audience: process.env.AUTH0_AUDIENCE,
  },
  enableAccessTokenEndpoint: false,
  logoutStrategy: "oidc",
  signInReturnToPath: "/dashboard",
  tokenRefreshBuffer: 60,
  session: {
    rolling: true,
    inactivityDuration: 8 * hour,
    absoluteDuration: 7 * 24 * hour,
    cookie: {
      sameSite: "lax",
      path: "/",
    },
  },
  onCallback: async (error, context) => {
    const baseUrl =
      context.appBaseUrl ?? process.env.APP_BASE_URL ?? "http://localhost:3000";

    if (error) {
      const cause =
        "cause" in error && typeof error.cause === "object"
          ? error.cause
          : null;
      const causeCode =
        cause && "code" in cause && typeof cause.code === "string"
          ? cause.code
          : null;

      console.error(
        "Auth0 callback failed:",
        causeCode ? `${error.code}/${causeCode}` : error.code,
      );

      return NextResponse.redirect(
        new URL("/auth/error?reason=authentication_failed", baseUrl),
      );
    }

    return NextResponse.redirect(
      new URL(safeReturnTo(context.returnTo), baseUrl),
    );
  },
});
