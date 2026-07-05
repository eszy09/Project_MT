import { AuthControls } from "./auth-controls";
import { getOptionalSession } from "./session";

export async function AuthNavigation() {
  const session = await getOptionalSession();

  return <AuthControls user={session?.user ?? null} />;
}
