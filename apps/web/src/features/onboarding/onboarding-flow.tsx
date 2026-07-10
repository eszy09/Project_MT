"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Badge, Surface, cn } from "@/components";
import type { OnboardingDraft } from "@/services";
import {
  completeOnboardingAction,
  saveBodyContextAction,
  saveGoalsAction,
  saveProfileAction,
} from "./actions";
import {
  experienceLevelOptions,
  primaryGoalLabel,
  primaryGoalOptions,
  targetAreaLabel,
  targetAreaOptions,
} from "./options";

type Step = 1 | 2 | 3 | 4;

type Props = {
  draft: OnboardingDraft | null;
  fallbackDisplayName: string;
  step: Step;
};

const initialState = { error: null, requestId: null };

export function OnboardingFlow({ draft, fallbackDisplayName, step }: Props) {
  return (
    <section className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <Badge>Personalize Project_MT</Badge>
        <h1 className="mt-5 text-5xl font-black tracking-[-0.05em] text-balance sm:text-6xl">
          Build your training starting point
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-300">
          Required fields are marked. Each stage saves before you continue, so
          your setup can move at the same pace as your decisions.
        </p>

        <div className="mt-8 rounded-[2rem] border border-violet-300/20 bg-violet-400/10 p-5">
          <p className="text-sm font-bold text-violet-100">Setup principle</p>
          <p className="mt-2 text-2xl font-black tracking-tight">
            Fast enough to start. Specific enough to guide.
          </p>
        </div>
      </aside>

      <div>
        <StepNavigation current={step} available={draft?.onboardingStep ?? 1} />

        <Surface className="mt-6 p-6 sm:p-8">
          {step === 1 && (
            <ProfileStage
              displayName={draft?.displayName ?? fallbackDisplayName}
            />
          )}
          {step === 2 && <GoalsStage draft={draft} />}
          {step === 3 && <BodyContextStage draft={draft} />}
          {step === 4 && draft && <ReviewStage draft={draft} />}
        </Surface>
      </div>
    </section>
  );
}

function StepNavigation({
  current,
  available,
}: {
  current: Step;
  available: number;
}) {
  const steps: ReadonlyArray<{ number: Step; label: string }> = [
    { number: 1, label: "Profile" },
    { number: 2, label: "Goals" },
    { number: 3, label: "Context" },
    { number: 4, label: "Review" },
  ];

  return (
    <ol aria-label="Onboarding progress" className="grid grid-cols-4 gap-2">
      {steps.map(({ number, label }) => {
        const availableStep = number <= available;
        const classes =
          number === current
            ? "border-lime-300 bg-lime-300 text-slate-950 shadow-lg shadow-lime-500/20"
            : availableStep
              ? "border-white/15 bg-white/[0.05] text-white hover:bg-white/10"
              : "border-white/10 bg-white/[0.02] text-slate-500";

        const content = (
          <>
            <span className="block text-[0.65rem] font-black tracking-[0.18em] uppercase opacity-70">
              Step {number}
            </span>
            <span className="mt-1 block font-black">{label}</span>
          </>
        );

        return (
          <li key={number}>
            {availableStep ? (
              <Link
                href={`/onboarding?step=${number}`}
                aria-current={number === current ? "step" : undefined}
                className={cn(
                  "block rounded-2xl border px-2 py-3 text-center text-xs transition sm:text-sm",
                  classes,
                )}
              >
                {content}
              </Link>
            ) : (
              <span
                className={cn(
                  "block rounded-2xl border px-2 py-3 text-center text-xs sm:text-sm",
                  classes,
                )}
              >
                {content}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function ProfileStage({ displayName }: { displayName: string }) {
  const [state, action, pending] = useActionState(
    saveProfileAction,
    initialState,
  );

  return (
    <form action={action}>
      <StageHeading
        eyebrow="Identity"
        title="How should we address you?"
        description="This name appears in your private training space. Keep it simple and recognizable."
      />
      <label htmlFor="displayName" className="mt-7 block font-bold">
        Display name <Required />
      </label>
      <input
        id="displayName"
        name="displayName"
        required
        maxLength={100}
        defaultValue={displayName}
        autoComplete="name"
        className="mt-3 w-full rounded-2xl border border-white/15 bg-slate-950/80 px-4 py-4 text-lg font-semibold shadow-inner shadow-black/20 transition outline-none focus:border-lime-300/70"
      />
      <FormFooter state={state} pending={pending} label="Save and continue" />
    </form>
  );
}

function GoalsStage({ draft }: { draft: OnboardingDraft | null }) {
  const [state, action, pending] = useActionState(
    saveGoalsAction,
    initialState,
  );

  return (
    <form action={action}>
      <StageHeading
        eyebrow="Training intent"
        title="What are you training toward?"
        description="Your goal and focus areas shape the first recommendations. This is the core signal for your plan."
      />
      <fieldset className="mt-7">
        <legend className="font-bold">
          Primary goal <Required />
        </legend>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {primaryGoalOptions.map((option) => (
            <label
              key={option.value}
              className="cursor-pointer rounded-3xl border border-white/15 bg-white/[0.035] p-5 transition has-checked:border-lime-300/70 has-checked:bg-lime-300/10 has-checked:shadow-lg has-checked:shadow-lime-500/10"
            >
              <input
                type="radio"
                name="primaryGoal"
                value={option.value}
                required
                defaultChecked={draft?.primaryGoal === option.value}
                className="mr-3 accent-lime-300"
              />
              <span className="text-lg font-black">{option.label}</span>
              <span className="mt-2 block text-sm leading-6 text-slate-400">
                {option.description}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="mt-8">
        <legend className="font-bold">
          Target areas <Required />
        </legend>
        <p className="mt-1 text-sm text-slate-400">Choose one or more.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {targetAreaOptions.map((option) => (
            <label
              key={option.value}
              className="cursor-pointer rounded-2xl border border-white/15 bg-white/[0.025] p-3 text-sm font-bold transition has-checked:border-violet-300/70 has-checked:bg-violet-400/15 has-checked:text-violet-100"
            >
              <input
                type="checkbox"
                name="targetAreas"
                value={option.value}
                defaultChecked={draft?.targetAreas.includes(option.value)}
                className="mr-2 accent-violet-300"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
      <FormFooter state={state} pending={pending} label="Save and continue" />
    </form>
  );
}

function BodyContextStage({ draft }: { draft: OnboardingDraft | null }) {
  const [state, action, pending] = useActionState(
    saveBodyContextAction,
    initialState,
  );

  return (
    <form action={action}>
      <StageHeading
        eyebrow="Body context"
        title="Add useful context"
        description="Add the shortest useful avatar baseline now. Waist and other circumference fields are captured during check-ins so setup stays fast."
      />
      <label htmlFor="experienceLevel" className="mt-7 block font-bold">
        Training experience <Optional />
      </label>
      <select
        id="experienceLevel"
        name="experienceLevel"
        defaultValue={draft?.experienceLevel ?? ""}
        className="mt-3 w-full rounded-2xl border border-white/15 bg-slate-950/80 px-4 py-4 font-semibold transition outline-none focus:border-lime-300/70"
      >
        <option value="">Prefer not to say</option>
        {experienceLevelOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <MeasurementField
          id="heightCm"
          label="Height in centimetres"
          min={50}
          max={300}
          value={draft?.heightCm}
        />
        <MeasurementField
          id="weightKg"
          label="Weight in kilograms"
          min={20}
          max={500}
          value={draft?.weightKg}
        />
      </div>
      <aside className="mt-6 rounded-3xl border border-cyan-300/20 bg-cyan-400/10 p-5 text-sm leading-6 text-slate-300">
        <strong className="text-cyan-200">Minimum avatar baseline:</strong>{" "}
        height and weight start the model here. Add waist during your first
        check-in to complete the minimum set; chest, hips, arms, thighs, and
        body fat remain optional precision fields.
      </aside>
      <FormFooter state={state} pending={pending} label="Save and review" />
    </form>
  );
}

function ReviewStage({ draft }: { draft: OnboardingDraft }) {
  const [state, action, pending] = useActionState(
    completeOnboardingAction,
    initialState,
  );

  return (
    <form action={action}>
      <StageHeading
        eyebrow="Final check"
        title="Review your starting point"
        description="You can go back to edit anything before completing setup."
      />
      <dl className="mt-7 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
        <ReviewRow
          label="Display name"
          value={draft.displayName}
          editStep={1}
        />
        <ReviewRow
          label="Primary goal"
          value={
            draft.primaryGoal
              ? primaryGoalLabel(draft.primaryGoal)
              : "Not provided"
          }
          editStep={2}
        />
        <ReviewRow
          label="Target areas"
          value={
            draft.targetAreas.map(targetAreaLabel).join(", ") || "Not provided"
          }
          editStep={2}
        />
        <ReviewRow
          label="Optional context"
          value={
            [
              draft.experienceLevel?.toLowerCase(),
              draft.heightCm ? `${draft.heightCm} cm` : null,
              draft.weightKg ? `${draft.weightKg} kg` : null,
            ]
              .filter(Boolean)
              .join(", ") || "Skipped"
          }
          editStep={3}
        />
      </dl>
      <FormFooter state={state} pending={pending} label="Complete setup" />
    </form>
  );
}

function MeasurementField({
  id,
  label,
  min,
  max,
  value,
}: {
  id: string;
  label: string;
  min: number;
  max: number;
  value?: number | null;
}) {
  return (
    <label htmlFor={id} className="block font-bold">
      {label} <Optional />
      <input
        id={id}
        name={id}
        type="number"
        min={min}
        max={max}
        step="0.1"
        defaultValue={value ?? ""}
        className="mt-3 w-full rounded-2xl border border-white/15 bg-slate-950/80 px-4 py-4 font-semibold transition outline-none focus:border-lime-300/70"
      />
    </label>
  );
}

function ReviewRow({
  label,
  value,
  editStep,
}: {
  label: string;
  value: string;
  editStep: Step;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 p-5 last:border-b-0">
      <div>
        <dt className="text-xs font-bold tracking-[0.18em] text-slate-500 uppercase">
          {label}
        </dt>
        <dd className="mt-2 text-lg font-black capitalize">{value}</dd>
      </div>
      <Link
        href={`/onboarding?step=${editStep}`}
        className="rounded-xl border border-lime-300/25 bg-lime-300/10 px-3 py-2 text-sm font-black text-lime-200 transition hover:bg-lime-300/15"
      >
        Edit
      </Link>
    </div>
  );
}

function StageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <>
      <p className="text-xs font-black tracking-[0.18em] text-lime-200 uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">{title}</h2>
      <p className="mt-3 max-w-2xl leading-7 text-slate-300">{description}</p>
    </>
  );
}

function FormFooter({
  state,
  pending,
  label,
}: {
  state: { error: string | null; requestId: string | null };
  pending: boolean;
  label: string;
}) {
  return (
    <div className="mt-8">
      {state.error && (
        <div
          role="alert"
          className="mb-4 rounded-2xl border border-red-300/30 bg-red-300/10 p-4 text-sm text-red-100"
        >
          <p>{state.error}</p>
          {state.requestId && (
            <p className="mt-1 font-mono text-xs text-red-200">
              Reference: {state.requestId}
            </p>
          )}
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-2xl bg-lime-300 px-6 py-3 font-black text-slate-950 shadow-lg shadow-lime-500/20 transition hover:bg-lime-200 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Saving..." : label}
      </button>
    </div>
  );
}

function Required() {
  return <span className="text-lime-300">(required)</span>;
}

function Optional() {
  return <span className="font-normal text-slate-400">(optional)</span>;
}
