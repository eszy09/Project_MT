const DEFAULT_AUTHENTICATED_PATH = "/dashboard";

export function safeReturnTo(returnTo?: string): string {
  if (
    !returnTo ||
    !returnTo.startsWith("/") ||
    returnTo.startsWith("//") ||
    returnTo.includes("\\")
  ) {
    return DEFAULT_AUTHENTICATED_PATH;
  }

  return returnTo;
}
