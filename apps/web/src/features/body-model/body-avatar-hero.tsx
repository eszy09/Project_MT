import Link from "next/link";
import { Badge, Surface, cn } from "@/components";
import type { AvatarSignals } from "./avatar-signals";
import { BodyModelCard } from "./body-model-card";
import {
  minimumAvatarMeasurements,
  optionalAvatarMeasurements,
} from "./measurement-strategy";

type AvatarReadiness = {
  label: string;
  value: string;
  tone: "lime" | "violet" | "cyan";
};

export function BodyAvatarHero({
  displayName,
  primaryGoal,
  targetAreaLabels,
  avatarSignals,
}: {
  displayName: string;
  primaryGoal: string;
  targetAreaSummary: string;
  targetAreaLabels: string[];
  avatarSignals: AvatarSignals;
}) {
  const readiness: AvatarReadiness[] = [
    {
      label: "Baseline",
      value: `${avatarSignals.readiness.completedCount}/${avatarSignals.readiness.totalCount}`,
      tone: avatarSignals.readiness.complete ? "lime" : "violet",
    },
    { label: "Goal", value: primaryGoal, tone: "cyan" },
    { label: "Signal", value: avatarSignals.confidenceLabel, tone: "lime" },
  ];

  return (
    <section className="mt-7 space-y-5">
      <Surface tone="active" className="relative overflow-hidden p-0">
        <div className="absolute -top-40 left-6 size-96 rounded-full bg-lime-300/15 blur-3xl" />
        <div className="absolute right-0 bottom-0 size-[32rem] rounded-full bg-violet-600/20 blur-3xl" />

        <div className="relative grid min-h-[34rem] xl:grid-cols-[0.95fr_1.05fr]">
          <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10">
            <div>
              <Badge>Avatar hub</Badge>
              <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.06em] text-balance sm:text-6xl">
                {displayName}&apos;s body model
              </h2>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {readiness.map((item) => (
                  <SignalCard key={item.label} item={item} />
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Action href="/check-ins/new" variant="primary">
                Add measurements
              </Action>
              <Action href="/workouts/active" variant="secondary">
                Train today
              </Action>
              <Action href="/progress" variant="ghost">
                View progress
              </Action>
            </div>
          </div>

          <div className="border-t border-white/10 bg-slate-950/35 p-4 xl:border-t-0 xl:border-l">
            <AvatarStudio
              targetAreaLabels={targetAreaLabels}
              avatarSignals={avatarSignals}
            />
          </div>
        </div>
      </Surface>

      <div className="grid gap-5 xl:grid-cols-[0.88fr_1.12fr]">
        <MeasurementStrategyPanel avatarSignals={avatarSignals} />
        <BodyModelCard />
      </div>
    </section>
  );
}

function SignalCard({ item }: { item: AvatarReadiness }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-4">
      <p
        className={cn(
          "text-[0.68rem] font-black tracking-[0.18em] uppercase",
          item.tone === "lime" && "text-lime-200",
          item.tone === "violet" && "text-violet-200",
          item.tone === "cyan" && "text-cyan-200",
        )}
      >
        {item.label}
      </p>
      <p className="mt-2 text-2xl font-black tracking-tight text-white">
        {item.value}
      </p>
    </div>
  );
}

function Action({
  href,
  children,
  variant,
}: {
  href: string;
  children: React.ReactNode;
  variant: "primary" | "secondary" | "ghost";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-12 items-center justify-center rounded-2xl px-6 py-3 text-sm font-black transition",
        variant === "primary" &&
          "bg-lime-300 text-slate-950 shadow-lg shadow-lime-500/20 hover:bg-lime-200",
        variant === "secondary" &&
          "border border-violet-300/30 bg-violet-400/10 text-violet-100 hover:bg-violet-400/15",
        variant === "ghost" &&
          "border border-white/15 bg-white/[0.04] text-slate-100 hover:bg-white/10",
      )}
    >
      {children}
    </Link>
  );
}

function AvatarStudio({
  targetAreaLabels,
  avatarSignals,
}: {
  targetAreaLabels: string[];
  avatarSignals: AvatarSignals;
}) {
  const torsoTransform = scaleTransform(130, avatarSignals.scales.torso);
  const waistTransform = scaleTransform(130, avatarSignals.scales.waist);
  const hipTransform = scaleTransform(130, avatarSignals.scales.hip);
  const armTransform = scaleTransform(130, avatarSignals.scales.arm);
  const thighTransform = scaleTransform(130, avatarSignals.scales.thigh);

  return (
    <div className="relative mx-auto max-w-xl">
      <div className="absolute inset-x-10 top-12 h-72 rounded-full bg-lime-300/10 blur-3xl" />
      <div className="absolute inset-x-8 bottom-16 h-72 rounded-full bg-violet-500/15 blur-3xl" />

      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_50%_12%,rgba(190,242,100,0.16),rgba(15,23,42,0.42)_38%,rgba(2,6,23,0.75)_100%)] p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black tracking-[0.18em] text-lime-200 uppercase">
              Live model
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {avatarSignals.measuredAt
                ? formatDate(avatarSignals.measuredAt)
                : "No check-in yet"}
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black text-slate-200 capitalize">
            {avatarSignals.source.replace("-", " ")}
          </span>
        </div>

        <svg
          viewBox="0 0 260 430"
          className="relative mx-auto mt-1 h-[31rem] max-h-[68vh] w-full drop-shadow-2xl"
          role="img"
          aria-label="Human avatar driven by profile and check-in measurements"
        >
          <defs>
            <linearGradient id="avatarSkin" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="44%" stopColor="#ddd6fe" />
              <stop offset="100%" stopColor="#bef264" />
            </linearGradient>
            <linearGradient id="muscleLine" x1="0" x2="1">
              <stop stopColor="#bef264" />
              <stop offset="1" stopColor="#a78bfa" />
            </linearGradient>
            <radialGradient id="avatarHalo" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#bef264" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse
            cx="130"
            cy="220"
            rx="118"
            ry="188"
            fill="url(#avatarHalo)"
          />
          <circle cx="130" cy="54" r="30" fill="#f8fafc" opacity="0.95" />
          <path
            d="M113 76 C121 82 139 82 147 76"
            fill="none"
            stroke="#94a3b8"
            strokeLinecap="round"
            strokeWidth="3"
            opacity="0.5"
          />

          <g transform={torsoTransform}>
            <path
              d="M95 92 C111 80 149 80 165 92 C183 116 187 151 178 188 C171 216 166 242 170 278 L182 389 C184 405 171 414 158 403 L136 289 C134 279 126 279 124 289 L102 403 C89 414 76 405 78 389 L90 278 C94 242 89 216 82 188 C73 151 77 116 95 92 Z"
              fill="url(#avatarSkin)"
              opacity="0.94"
            />
          </g>

          <g transform={armTransform}>
            <path
              d="M84 108 C58 134 47 178 42 232 C41 247 52 256 63 244 C67 199 76 163 92 136 Z"
              fill="#ddd6fe"
              opacity="0.88"
            />
            <path
              d="M176 108 C202 134 213 178 218 232 C219 247 208 256 197 244 C193 199 184 163 168 136 Z"
              fill="#ddd6fe"
              opacity="0.88"
            />
          </g>

          <g opacity="0.78">
            <path
              d="M101 121 C116 133 144 133 159 121"
              fill="none"
              stroke="url(#muscleLine)"
              strokeLinecap="round"
              strokeWidth="4"
            />
            <path
              d="M112 138 C120 146 140 146 148 138"
              fill="none"
              stroke="#f8fafc"
              strokeLinecap="round"
              strokeWidth="3"
              opacity="0.46"
            />
          </g>

          <g transform={waistTransform}>
            <path
              d="M100 168 C116 178 144 178 160 168 C158 203 151 226 130 226 C109 226 102 203 100 168 Z"
              fill="#030712"
              opacity="0.18"
            />
            <path
              d="M92 140 C111 152 149 152 168 140"
              fill="none"
              stroke="#bef264"
              strokeLinecap="round"
              strokeOpacity="0.82"
              strokeWidth="5"
            />
          </g>

          <g transform={hipTransform}>
            <path
              d="M98 218 C115 228 145 228 162 218"
              fill="none"
              stroke="#a78bfa"
              strokeLinecap="round"
              strokeOpacity="0.82"
              strokeWidth="5"
            />
          </g>

          <g transform={thighTransform} opacity="0.52">
            <path
              d="M101 266 C113 276 121 276 128 266"
              stroke="#bef264"
              strokeLinecap="round"
              strokeWidth="5"
            />
            <path
              d="M132 266 C139 276 147 276 159 266"
              stroke="#bef264"
              strokeLinecap="round"
              strokeWidth="5"
            />
          </g>
        </svg>

        <div className="grid grid-cols-5 gap-2 text-xs">
          <AvatarScale label="Torso" value={avatarSignals.scales.torso} />
          <AvatarScale label="Waist" value={avatarSignals.scales.waist} />
          <AvatarScale label="Hip" value={avatarSignals.scales.hip} />
          <AvatarScale label="Arm" value={avatarSignals.scales.arm} />
          <AvatarScale label="Thigh" value={avatarSignals.scales.thigh} />
        </div>
      </div>

      <div className="relative mt-3 flex flex-wrap gap-2">
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
  );
}

function MeasurementStrategyPanel({
  avatarSignals,
}: {
  avatarSignals: AvatarSignals;
}) {
  return (
    <Surface className="p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black tracking-[0.18em] text-slate-400 uppercase">
            Avatar input
          </p>
          <h3 className="mt-2 text-2xl font-black tracking-tight">
            Minimum first
          </h3>
        </div>
        <span className="rounded-full border border-lime-300/25 bg-lime-300/10 px-3 py-1 text-xs font-black text-lime-200">
          {avatarSignals.readiness.completedCount}/
          {avatarSignals.readiness.totalCount}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {minimumAvatarMeasurements.map((measurement) => (
          <AvatarMeasurementRow
            key={measurement.id}
            label={measurement.label}
            ready={
              !avatarSignals.readiness.missingMinimum.some(
                (missing) => missing.id === measurement.id,
              )
            }
          />
        ))}
      </div>

      <div className="mt-4 rounded-3xl border border-violet-300/20 bg-violet-400/10 p-4">
        <p className="text-xs font-black tracking-[0.18em] text-violet-100 uppercase">
          Optional precision
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          {optionalAvatarMeasurements
            .map((measurement) => measurement.label)
            .join(" · ")}
        </p>
      </div>
    </Surface>
  );
}

function AvatarMeasurementRow({
  label,
  ready,
}: {
  label: string;
  ready: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-black">{label}</p>
        <span
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-black",
            ready
              ? "border-lime-300/25 bg-lime-300/10 text-lime-200"
              : "border-violet-300/25 bg-violet-400/10 text-violet-100",
          )}
        >
          {ready ? "Set" : "Add"}
        </span>
      </div>
    </div>
  );
}

function AvatarScale({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-2 text-center">
      <p className="font-black text-slate-200">{label}</p>
      <p className="mt-1 font-mono text-[0.68rem] text-slate-400">
        {value.toFixed(2)}x
      </p>
    </div>
  );
}

function scaleTransform(centerX: number, scale: number) {
  return `translate(${centerX - centerX * scale} 0) scale(${scale} 1)`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
