type AuthenticatedUserSummary = {
  name?: string;
  email?: string;
  picture?: string;
};

type AuthControlsProps = {
  user: AuthenticatedUserSummary | null;
  displayName?: string | null;
};

export function AuthControls({ user, displayName }: AuthControlsProps) {
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

  const label = displayName ?? user.name ?? user.email ?? "Signed in";
  const fallbackInitials = initials(label);

  return (
    <div className="flex items-center gap-3">
      <a
        href="/settings"
        className="group flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.035] py-1 pr-3 pl-1 transition hover:border-lime-300/25 hover:bg-white/[0.06]"
        aria-label={`Open settings for ${label}`}
      >
        {user.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.picture}
            alt=""
            className="size-10 rounded-full border border-lime-300/30 object-cover"
          />
        ) : (
          <span className="grid size-10 place-items-center rounded-full border border-lime-300/30 bg-lime-300/10 text-sm font-black text-lime-200">
            {fallbackInitials}
          </span>
        )}
        <span className="hidden max-w-44 truncate text-sm font-black text-slate-100 sm:inline">
          {label}
        </span>
      </a>

      <a
        href="/auth/logout"
        className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.03] px-4 py-2 text-sm font-bold text-slate-100 transition hover:bg-white/10"
      >
        Sign out
      </a>
    </div>
  );
}

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "M";
  const second = parts.length > 1 ? parts[1]?.[0] : parts[0]?.[1];
  return `${first}${second ?? "T"}`.toUpperCase();
}
