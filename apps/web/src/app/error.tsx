"use client";

export default function ErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section
      role="alert"
      className="m-auto max-w-lg rounded-2xl border border-red-400/20 bg-red-400/5 p-8 text-center"
    >
      <h1 className="text-2xl font-semibold">Something went wrong</h1>

      <p className="mt-3 text-slate-300">
        The page could not be loaded. Your saved data has not been changed.
      </p>

      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-white px-4 py-2 font-medium text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Try again
      </button>
    </section>
  );
}
