"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Badge, Surface } from "@/components";
import {
  createCheckinAction,
  type CheckinActionState,
} from "./checkin-actions";

const initialState: CheckinActionState = { error: null, requestId: null };

export function CheckinForm({
  defaultMeasuredAt,
}: {
  defaultMeasuredAt: string;
}) {
  const [state, action, pending] = useActionState(
    createCheckinAction,
    initialState,
  );

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.82fr_1.18fr]">
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <Link
          href="/dashboard?tab=check-ins"
          className="text-sm font-bold text-slate-400 transition hover:text-white"
        >
          ← Dashboard check-ins
        </Link>
        <div className="mt-6">
          <Badge>Progress input</Badge>
          <h1 className="mt-5 text-5xl font-black tracking-[-0.05em] text-balance sm:text-6xl">
            Log a body check-in
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Capture the avatar minimum set first: weight and waist. Add the rest
            only when you can measure it consistently. Keep photos/media
            separate until the media loop is ready.
          </p>
        </div>

        <Surface tone="active" className="mt-8 p-5">
          <p className="text-sm font-bold text-lime-100">Recommended habit</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-white">
            Same conditions, same cadence.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Morning check-ins, consistent units, and simple notes make trend
            summaries more useful than noisy daily guesses.
          </p>
        </Surface>
      </aside>

      <Surface className="p-6 sm:p-8">
        <form action={action}>
          <div>
            <p className="text-xs font-black tracking-[0.18em] text-lime-200 uppercase">
              New check-in
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
              Record today&apos;s baseline
            </h2>
            <p className="mt-3 max-w-2xl leading-7 text-slate-300">
              Only date/time is technically required. For the avatar baseline,
              add waist if this is your first measurement check-in; other fields
              improve precision later.
            </p>
          </div>

          {state.error && (
            <div
              role="alert"
              className="mt-6 rounded-2xl border border-red-300/30 bg-red-300/10 p-4 text-sm text-red-100"
            >
              <p>{state.error}</p>
              {state.requestId && (
                <p className="mt-1 font-mono text-xs text-red-200">
                  Reference: {state.requestId}
                </p>
              )}
            </div>
          )}

          <label htmlFor="measuredAt" className="mt-7 block font-bold">
            Check-in date and time <Required />
          </label>
          <input
            id="measuredAt"
            name="measuredAt"
            type="datetime-local"
            required
            defaultValue={defaultMeasuredAt}
            className="mt-3 w-full rounded-2xl border border-white/15 bg-slate-950/80 px-4 py-4 font-semibold transition outline-none focus:border-lime-300/70"
          />

          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <MeasurementField
              id="weight"
              label="Body weight"
              unit="kg"
              min={0.001}
              max={500}
              recommended
            />
            <MeasurementField
              id="bodyFatPercent"
              label="Body fat"
              unit="%"
              min={2}
              max={75}
            />
            <MeasurementField id="chest" label="Chest" unit="cm" min={0.001} />
            <MeasurementField
              id="waist"
              label="Waist"
              unit="cm"
              min={0.001}
              recommended
            />
            <MeasurementField id="hips" label="Hips" unit="cm" min={0.001} />
            <MeasurementField id="arm" label="Arm" unit="cm" min={0.001} />
            <MeasurementField id="thigh" label="Thigh" unit="cm" min={0.001} />
          </div>

          <label htmlFor="notes" className="mt-7 block font-bold">
            Notes <Optional />
          </label>
          <textarea
            id="notes"
            name="notes"
            maxLength={1000}
            rows={5}
            placeholder="Sleep, soreness, hydration, stress, cycle context, or anything that explains the data."
            className="mt-3 w-full resize-y rounded-2xl border border-white/15 bg-slate-950/80 px-4 py-4 font-semibold transition outline-none placeholder:text-slate-600 focus:border-lime-300/70"
          />

          <aside className="mt-6 rounded-3xl border border-violet-300/20 bg-violet-400/10 p-5 text-sm leading-6 text-slate-300">
            <strong className="text-violet-100">Privacy note:</strong> this form
            stores measurement context only. Media uploads should be added later
            through a separate consent-first media flow.
          </aside>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={pending}
              className="rounded-2xl bg-lime-300 px-6 py-3 font-black text-slate-950 shadow-lg shadow-lime-500/20 transition hover:bg-lime-200 disabled:cursor-wait disabled:opacity-60"
            >
              {pending ? "Saving check-in..." : "Save check-in"}
            </button>
            <Link
              href="/progress"
              className="inline-flex min-h-12 items-center rounded-2xl border border-white/15 px-5 font-bold transition hover:bg-white/10"
            >
              View progress
            </Link>
          </div>
        </form>
      </Surface>
    </section>
  );
}

function MeasurementField({
  id,
  label,
  unit,
  min,
  max,
  recommended = false,
}: {
  id: string;
  label: string;
  unit: string;
  min: number;
  max?: number;
  recommended?: boolean;
}) {
  return (
    <label htmlFor={id} className="block font-bold">
      {label} {recommended ? <Recommended /> : <Optional />}
      <div className="mt-3 flex overflow-hidden rounded-2xl border border-white/15 bg-slate-950/80 transition focus-within:border-lime-300/70">
        <input
          id={id}
          name={id}
          type="number"
          min={min}
          max={max}
          step="0.1"
          className="min-h-14 w-full bg-transparent px-4 font-semibold outline-none"
        />
        <span className="grid min-w-16 place-items-center border-l border-white/10 bg-white/[0.035] text-sm font-black text-slate-400">
          {unit}
        </span>
      </div>
    </label>
  );
}

function Required() {
  return <span className="text-lime-300">(required)</span>;
}

function Optional() {
  return <span className="font-normal text-slate-400">(optional)</span>;
}

function Recommended() {
  return <span className="font-normal text-lime-300">(avatar minimum)</span>;
}
