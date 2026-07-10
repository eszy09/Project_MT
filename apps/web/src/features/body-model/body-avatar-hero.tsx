import Link from "next/link";
import { Badge, Surface, cn } from "@/components";
import { BodyModelCard } from "./body-model-card";

type AvatarReadiness = {
  label: string;
  value: string;
  detail: string;
  tone: "lime" | "violet" | "cyan";
};

const parameterPlan = [
  {
    label: "Height + weight",
    target: "overall scale and mass signal",
    ready: true,
  },
  {
    label: "Waist + hips",
    target: "torso, waist, and hip proportions",
    ready: false,
  },
  {
    label: "Arm + thigh",
    target: "limb proportion signals",
    ready: false,
  },
] as const;

export function BodyAvatarHero({
  displayName,
  primaryGoal,
  targetAreaSummary,
  targetAreaLabels,
}: {
  displayName: string;
  primaryGoal: string;
  targetAreaSummary: string;
  targetAreaLabels: string[];
}) {
  const readiness: AvatarReadiness[] = [
    {
      label: "Identity",
      value: displayName,
      detail: "The avatar is tied to the signed-in user profile.",
      tone: "lime",
    },
    {
      label: "Training intent",
      value: primaryGoal,
      detail: `Current training context prioritizes ${targetAreaSummary}.`,
      tone: "violet",
    },
    {
      label: "Avatar data",
      value: "Check-in next",
      detail: "Measurements will drive proportion changes in the next phase.",
      tone: "cyan",
    },
  ];

  return (
    <section className="mt-10 grid gap-6 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
      <Surface tone="active" className="relative overflow-hidden p-6 sm:p-8">
        <div className="absolute -top-32 right-4 size-80 rounded-full bg-lime-300/10 blur-3xl" />
        <div className="absolute -bottom-36 left-1/4 size-96 rounded-full bg-violet-500/15 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <Badge>Human progress avatar</Badge>
            <h2 className="mt-5 text-5xl font-black tracking-[-0.055em] text-balance sm:text-6xl">
              Your body model becomes the center of the app.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              Project_MT should feel built around a human training journey: the
              avatar, your check-ins, your workouts, and the context behind
              progress. This phase makes the avatar the dashboard anchor.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/check-ins/new"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-lime-300 px-6 py-3 text-sm font-black text-slate-950 shadow-lg shadow-lime-500/20 transition hover:bg-lime-200"
              >
                Add measurements
              </Link>
              <Link
                href="/progress"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-violet-300/30 bg-violet-400/10 px-6 py-3 text-sm font-bold text-violet-100 transition hover:bg-violet-400/15"
              >
                Review progress
              </Link>
            </div>
          </div>

          <AvatarSilhouette targetAreaLabels={targetAreaLabels} />
        </div>
      </Surface>

      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          {readiness.map((item) => (
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
              <p className="mt-3 text-2xl font-black tracking-tight">
                {item.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {item.detail}
              </p>
            </Surface>
          ))}
        </div>

        <Surface className="p-5">
          <p className="text-xs font-black tracking-[0.18em] text-slate-400 uppercase">
            Measurement mapping plan
          </p>
          <div className="mt-4 space-y-3">
            {parameterPlan.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-slate-950/45 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black">{item.label}</p>
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-black",
                      item.ready
                        ? "border-lime-300/25 bg-lime-300/10 text-lime-200"
                        : "border-violet-300/25 bg-violet-400/10 text-violet-100",
                    )}
                  >
                    {item.ready ? "Ready" : "Phase 2"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-400">{item.target}</p>
              </div>
            ))}
          </div>
        </Surface>
      </div>

      <div className="xl:col-span-2">
        <BodyModelCard />
      </div>
    </section>
  );
}

function AvatarSilhouette({
  targetAreaLabels,
}: {
  targetAreaLabels: string[];
}) {
  return (
    <div className="relative mx-auto w-full max-w-sm rounded-[2.5rem] border border-white/10 bg-slate-950/45 p-5 shadow-2xl shadow-black/30">
      <div className="absolute inset-x-8 top-8 h-32 rounded-full bg-lime-300/10 blur-3xl" />
      <svg
        viewBox="0 0 260 420"
        className="relative mx-auto h-[26rem] max-h-[65vh] w-full"
        role="img"
        aria-label="Human-centered avatar silhouette prepared for measurement-driven proportions"
      >
        <defs>
          <linearGradient id="avatarBody" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="48%" stopColor="#c4b5fd" />
            <stop offset="100%" stopColor="#bef264" />
          </linearGradient>
          <radialGradient id="avatarGlow" cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#bef264" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="130" cy="214" rx="112" ry="178" fill="url(#avatarGlow)" />
        <circle cx="130" cy="56" r="31" fill="#f8fafc" opacity="0.94" />
        <path
          d="M96 91 C111 80 149 80 164 91 C180 111 185 146 178 184 C172 217 166 242 170 278 L181 382 C182 397 171 407 158 398 L135 286 C133 276 127 276 125 286 L102 398 C89 407 78 397 79 382 L90 278 C94 242 88 217 82 184 C75 146 80 111 96 91 Z"
          fill="url(#avatarBody)"
          opacity="0.92"
        />
        <path
          d="M83 108 C60 133 48 174 43 229 C42 243 52 251 62 241 C66 197 75 164 91 136 Z"
          fill="#d8b4fe"
          opacity="0.86"
        />
        <path
          d="M177 108 C200 133 212 174 217 229 C218 243 208 251 198 241 C194 197 185 164 169 136 Z"
          fill="#d8b4fe"
          opacity="0.86"
        />
        <path
          d="M100 168 C116 178 144 178 160 168 C158 203 151 226 130 226 C109 226 102 203 100 168 Z"
          fill="#030712"
          opacity="0.2"
        />
        <path
          d="M92 139 C111 151 149 151 168 139"
          fill="none"
          stroke="#bef264"
          strokeLinecap="round"
          strokeOpacity="0.75"
          strokeWidth="5"
        />
        <path
          d="M98 216 C115 226 145 226 162 216"
          fill="none"
          stroke="#a78bfa"
          strokeLinecap="round"
          strokeOpacity="0.75"
          strokeWidth="5"
        />
      </svg>
      <div className="relative rounded-3xl border border-white/10 bg-white/[0.045] p-4">
        <p className="text-xs font-black tracking-[0.18em] text-lime-200 uppercase">
          Focus areas
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {targetAreaLabels.map((label) => (
            <span
              key={label}
              className="rounded-full border border-violet-300/25 bg-violet-400/10 px-3 py-1 text-xs font-black text-violet-100"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
