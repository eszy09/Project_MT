type AuthenticatedUserSummary = {
  name?: string;
  email?: string;
};

type AuthControlsProps = {
  user: AuthenticatedUserSummary | null;
};

export function AuthControls({ user }: AuthControlsProps) {
  if (!user) {
    return (
      <a
        href="/auth/login"
        className="rounded-lg bg-emerald-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-200"
      >
        Sign in
      </a>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span className="hidden text-sm text-slate-300 sm:inline">
        {user.name ?? user.email ?? "Signed in"}
      </span>

      <a
        href="/auth/logout"
        className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/10"
      >
        Sign out
      </a>
    </div>
  );
}
