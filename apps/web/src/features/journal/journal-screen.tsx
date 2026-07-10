import Link from "next/link";
import { Badge, Surface, cn } from "@/components";

const prompts = [
  "What changed visually since the last check-in?",
  "What affected training quality this week?",
  "What should future-you remember before comparing photos?",
] as const;

const mediaSlots = [
  { label: "Front", state: "Planned" },
  { label: "Side", state: "Planned" },
  { label: "Back", state: "Planned" },
] as const;

const timeline = [
  {
    label: "Today",
    title: "Create private context",
    detail: "Add notes around sleep, soreness, stress, food, and confidence.",
    tone: "lime",
  },
  {
    label: "Next",
    title: "Attach consent-first media",
    detail:
      "Progress photos need explicit consent, clear purpose, and delete paths.",
    tone: "violet",
  },
  {
    label: "Later",
    title: "Compare against check-ins",
    detail: "Pair notes, photos, and measurements before drawing conclusions.",
    tone: "cyan",
  },
] as const;

export function JournalScreen() {
  return (
    <section className="w-full">
      <Link
        href="/dashboard?tab=journal"
        className="text-sm font-bold text-slate-400 transition hover:text-white"
      >
        ← Dashboard journal
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-start">
        <div>
          <Badge>Private memory layer</Badge>
          <h1 className="mt-5 max-w-4xl text-5xl font-black tracking-[-0.05em] text-balance sm:text-6xl">
            Journal context before the numbers lie to you.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Progress is not just weight and volume. This surface captures the
            human context around check-ins so future comparisons are fairer and
            less reactive.
          </p>
        </div>

        <Surface tone="active" className="p-5">
          <p className="text-sm font-bold text-lime-100">Current scope</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-white">
            UI shell only
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Persistence, media uploads, retention, and deletion rules need a
            dedicated backend/data-model issue before this becomes writable.
          </p>
        </Surface>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Surface className="p-6 sm:p-8">
          <p className="text-xs font-black tracking-[0.18em] text-lime-200 uppercase">
            Draft note
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
            Capture the context for your next comparison
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {prompts.map((prompt) => (
              <div
                key={prompt}
                className="rounded-3xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 font-semibold text-slate-300"
              >
                {prompt}
              </div>
            ))}
          </div>

          <label htmlFor="journal-note" className="mt-7 block font-bold">
            Private note
          </label>
          <textarea
            id="journal-note"
            rows={8}
            placeholder="Example: Training felt heavy after poor sleep. Waist check-in may be affected by late meal and hydration. Shoulder pump looked stronger than last week."
            className="mt-3 w-full resize-y rounded-3xl border border-white/15 bg-slate-950/80 px-4 py-4 leading-7 font-semibold shadow-inner shadow-black/20 transition outline-none placeholder:text-slate-600 focus:border-lime-300/70"
          />

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled
              className="rounded-2xl bg-lime-300 px-6 py-3 font-black text-slate-950 opacity-50"
            >
              Save note later
            </button>
            <Link
              href="/check-ins/new"
              className="inline-flex min-h-12 items-center rounded-2xl border border-violet-300/30 bg-violet-400/10 px-5 font-bold text-violet-100 transition hover:bg-violet-400/15"
            >
              Log check-in
            </Link>
          </div>
        </Surface>

        <Surface className="p-6 sm:p-8">
          <p className="text-xs font-black tracking-[0.18em] text-violet-200 uppercase">
            Media plan
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
            Progress photos need guardrails
          </h2>
          <div className="mt-6 grid gap-3">
            {mediaSlots.map((slot) => (
              <div
                key={slot.label}
                className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-950/55 p-4"
              >
                <div>
                  <p className="font-black">{slot.label} photo</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Upload placeholder for the future media service.
                  </p>
                </div>
                <span className="rounded-full border border-violet-300/25 bg-violet-400/10 px-3 py-1 text-xs font-black text-violet-100">
                  {slot.state}
                </span>
              </div>
            ))}
          </div>
        </Surface>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        {timeline.map((item) => (
          <Surface key={item.label} className="p-5">
            <p
              className={cn(
                "text-xs font-black tracking-[0.18em] uppercase",
                item.tone === "lime" && "text-lime-200",
                item.tone === "violet" && "text-violet-200",
                item.tone === "cyan" && "text-cyan-200",
              )}
            >
              {item.label}
            </p>
            <h3 className="mt-3 text-2xl font-black tracking-tight">
              {item.title}
            </h3>
            <p className="mt-3 leading-7 text-slate-300">{item.detail}</p>
          </Surface>
        ))}
      </div>
    </section>
  );
}
