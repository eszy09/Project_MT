"use client";

export default function ActiveWorkoutError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section
      role="alert"
      className="m-auto w-full max-w-lg rounded-2xl border border-red-300/25 bg-red-300/5 p-8 text-center"
    >
      <h1 className="text-2xl font-bold">Workout could not be opened</h1>
      <p className="mt-3 text-slate-300">
        Your saved workout history has not been changed. Check the connection
        and try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 min-h-11 rounded-lg bg-white px-5 py-2 font-bold text-slate-950"
      >
        Try again
      </button>
    </section>
  );
}
