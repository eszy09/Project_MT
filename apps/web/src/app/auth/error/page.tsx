export default function AuthenticationErrorPage() {
  return (
    <section
      role="alert"
      className="m-auto max-w-lg rounded-2xl border border-amber-300/20 bg-amber-300/5 p-8 text-center"
    >
      <h1 className="text-2xl font-semibold">We could not complete sign-in</h1>

      <p className="mt-3 text-slate-300">
        Your session may have expired or the authentication request may no
        longer be valid. No account data was changed.
      </p>

      <a
        href="/auth/login?returnTo=%2Fdashboard"
        className="mt-6 inline-block rounded-lg bg-white px-4 py-2 font-medium text-slate-950"
      >
        Start a new sign-in
      </a>
    </section>
  );
}
