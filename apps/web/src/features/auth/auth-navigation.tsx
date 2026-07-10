import { getOnboardingDraft } from "@/services";
import { AuthControls } from "./auth-controls";
import { getOptionalSession } from "./session";

export async function AuthNavigation() {
  const session = await getOptionalSession();
  let displayName: string | null = null;

  if (session) {
    try {
      displayName = (await getOnboardingDraft())?.displayName ?? null;
    } catch {
      displayName = null;
    }
  }

  return (
    <AuthControls user={session?.user ?? null} displayName={displayName} />
  );
}
