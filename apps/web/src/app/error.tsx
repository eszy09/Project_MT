"use client";

import { Surface } from "@/components";

export default function ErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="m-auto w-full max-w-2xl">
      <Surface tone="danger" className="p-10 text-center">
        <p className="text-sm font-bold tracking-[0.18em] text-red-200 uppercase">
          Recovery state
        </p>
        <h1 className="mt-4 text-4xl font-black tracking-[-0.04em]">
          Something went wrong
        </h1>

        <p className="mx-auto mt-4 max-w-md text-lg leading-8 text-slate-300">
          The page could not be loaded. Your saved data has not been changed.
        </p>

        <button
          type="button"
          onClick={reset}
          className="mt-7 rounded-2xl bg-white px-6 py-3 font-black text-slate-950 transition hover:bg-lime-100 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Try again
        </button>
      </Surface>
    </section>
  );
}
