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
        className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-lime-300 px-5 py-2 text-sm font-extrabold text-slate-950 shadow-lg shadow-lime-500/20 transition hover:bg-lime-200"
      >
        Sign in
      </a>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span className="hidden text-sm font-medium text-slate-200 sm:inline">
        {user.name ?? user.email ?? "Signed in"}
      </span>

      <a
        href="/auth/logout"
        className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.03] px-5 py-2 text-sm font-bold text-slate-100 transition hover:bg-white/10"
      >
        Sign out
      </a>
    </div>
  );
}
