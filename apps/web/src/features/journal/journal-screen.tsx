import Link from "next/link";
import { Badge, Surface, cn } from "@/components";

const prompts = ["Visual change", "Training quality", "Recovery note"] as const;
const mediaSlots = ["Front", "Side", "Back"] as const;

export function JournalScreen() {
  return (
    <section className="w-full">
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <Badge>Journal</Badge>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.05em] text-balance sm:text-6xl">
            Private training context
          </h1>
        </div>
        <Link
          href="/check-ins/new"
          className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-lime-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-lime-200"
        >
          Log check-in
        </Link>
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Surface className="p-6 sm:p-7">
          <div className="flex flex-wrap gap-2">
            {prompts.map((prompt) => (
              <span
                key={prompt}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-black text-slate-300"
              >
                {prompt}
              </span>
            ))}
          </div>

          <label htmlFor="journal-note" className="mt-6 block font-black">
            Note
          </label>
          <textarea
            id="journal-note"
            rows={10}
            placeholder="What should future-you know before comparing progress?"
            className="mt-3 w-full resize-y rounded-3xl border border-white/15 bg-slate-950/80 px-4 py-4 leading-7 font-semibold shadow-inner shadow-black/20 transition outline-none placeholder:text-slate-600 focus:border-lime-300/70"
          />

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled
              className="rounded-2xl bg-lime-300 px-6 py-3 font-black text-slate-950 opacity-50"
            >
              Save later
            </button>
            <span className="inline-flex items-center text-sm font-bold text-slate-500">
              Backend persistence planned
            </span>
          </div>
        </Surface>

        <Surface className="p-6 sm:p-7">
          <p className="text-xs font-black tracking-[0.18em] text-violet-200 uppercase">
            Media
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
            Progress photos
          </h2>
          <div className="mt-5 grid gap-3">
            {mediaSlots.map((slot, index) => (
              <div
                key={slot}
                className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-950/55 p-4"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "grid size-10 place-items-center rounded-2xl border text-sm font-black",
                      index === 0 &&
                        "border-lime-300/25 bg-lime-300/10 text-lime-200",
                      index === 1 &&
                        "border-violet-300/25 bg-violet-400/10 text-violet-100",
                      index === 2 &&
                        "border-cyan-300/25 bg-cyan-400/10 text-cyan-100",
                    )}
                  >
                    {index + 1}
                  </span>
                  <p className="font-black">{slot}</p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-black text-slate-400">
                  Planned
                </span>
              </div>
            ))}
          </div>
        </Surface>
      </div>
    </section>
  );
}
