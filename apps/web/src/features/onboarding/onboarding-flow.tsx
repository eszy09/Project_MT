"use client";

import Link from "next/link";
import { useActionState } from "react";
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
    <section className="mx-auto w-full max-w-3xl">
      <div className="mb-8">
        <p className="text-sm font-semibold tracking-widest text-emerald-300 uppercase">
          Personalize Project_MT
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Build your training starting point
        </h1>
        <p className="mt-3 text-slate-300">
          Required fields are marked. Each stage saves before you continue.
        </p>
      </div>

      <StepNavigation current={step} available={draft?.onboardingStep ?? 1} />

      <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-xl sm:p-8">
        {step === 1 && (
          <ProfileStage
            displayName={draft?.displayName ?? fallbackDisplayName}
          />
        )}
        {step === 2 && <GoalsStage draft={draft} />}
        {step === 3 && <BodyContextStage draft={draft} />}
        {step === 4 && draft && <ReviewStage draft={draft} />}
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
            ? "border-emerald-300 bg-emerald-300 text-slate-950"
            : availableStep
              ? "border-white/20 bg-white/10 text-white"
              : "border-white/10 text-slate-500";

        return (
          <li key={number}>
            {availableStep ? (
              <Link
                href={`/onboarding?step=${number}`}
                aria-current={number === current ? "step" : undefined}
                className={`block rounded-lg border px-2 py-3 text-center text-xs font-semibold sm:text-sm ${classes}`}
              >
                {number}. {label}
              </Link>
            ) : (
              <span
                className={`block rounded-lg border px-2 py-3 text-center text-xs font-semibold sm:text-sm ${classes}`}
              >
                {number}. {label}
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
        title="How should we address you?"
        description="This name appears in your private training space."
      />
      <label htmlFor="displayName" className="mt-6 block font-semibold">
        Display name <Required />
      </label>
      <input
        id="displayName"
        name="displayName"
        required
        maxLength={100}
        defaultValue={displayName}
        autoComplete="name"
        className="mt-2 w-full rounded-lg border border-white/15 bg-slate-950 px-4 py-3"
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
        title="What are you training toward?"
        description="Your goal and focus areas shape the first recommendations."
      />
      <fieldset className="mt-6">
        <legend className="font-semibold">
          Primary goal <Required />
        </legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {primaryGoalOptions.map((option) => (
            <label
              key={option.value}
              className="cursor-pointer rounded-xl border border-white/15 bg-white/5 p-4 has-checked:border-emerald-300 has-checked:bg-emerald-300/10"
            >
              <input
                type="radio"
                name="primaryGoal"
                value={option.value}
                required
                defaultChecked={draft?.primaryGoal === option.value}
                className="mr-2 accent-emerald-300"
              />
              <span className="font-semibold">{option.label}</span>
              <span className="mt-1 block text-sm text-slate-400">
                {option.description}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="mt-7">
        <legend className="font-semibold">
          Target areas <Required />
        </legend>
        <p className="mt-1 text-sm text-slate-400">Choose one or more.</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {targetAreaOptions.map((option) => (
            <label
              key={option.value}
              className="cursor-pointer rounded-lg border border-white/15 p-3 has-checked:border-emerald-300 has-checked:bg-emerald-300/10"
            >
              <input
                type="checkbox"
                name="targetAreas"
                value={option.value}
                defaultChecked={draft?.targetAreas.includes(option.value)}
                className="mr-2 accent-emerald-300"
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
        title="Add useful context"
        description="Everything on this stage is optional."
      />
      <label htmlFor="experienceLevel" className="mt-6 block font-semibold">
        Training experience <Optional />
      </label>
      <select
        id="experienceLevel"
        name="experienceLevel"
        defaultValue={draft?.experienceLevel ?? ""}
        className="mt-2 w-full rounded-lg border border-white/15 bg-slate-950 px-4 py-3"
      >
        <option value="">Prefer not to say</option>
        {experienceLevelOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
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
      <aside className="mt-5 rounded-lg border border-sky-300/20 bg-sky-300/5 p-4 text-sm text-slate-300">
        <strong className="text-sky-200">Why we ask:</strong> body measurements
        can improve progress context and future exercise guidance. They are
        private, optional, and are not used to diagnose health conditions.
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
        title="Review your starting point"
        description="You can go back to edit anything before completing setup."
      />
      <dl className="mt-6 divide-y divide-white/10 rounded-xl border border-white/10">
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
    <label htmlFor={id} className="block font-semibold">
      {label} <Optional />
      <input
        id={id}
        name={id}
        type="number"
        min={min}
        max={max}
        step="0.1"
        defaultValue={value ?? ""}
        className="mt-2 w-full rounded-lg border border-white/15 bg-slate-950 px-4 py-3"
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
    <div className="flex items-center justify-between gap-4 p-4">
      <div>
        <dt className="text-sm text-slate-400">{label}</dt>
        <dd className="mt-1 font-medium capitalize">{value}</dd>
      </div>
      <Link
        href={`/onboarding?step=${editStep}`}
        className="text-sm font-semibold text-emerald-300"
      >
        Edit
      </Link>
    </div>
  );
}

function StageHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="mt-2 text-slate-300">{description}</p>
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
          className="mb-4 rounded-lg border border-red-300/30 bg-red-300/10 p-3 text-sm text-red-100"
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
        className="rounded-lg bg-emerald-300 px-5 py-3 font-bold text-slate-950 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Saving..." : label}
      </button>
    </div>
  );
}

function Required() {
  return <span className="text-emerald-300">(required)</span>;
}

function Optional() {
  return <span className="font-normal text-slate-400">(optional)</span>;
}
