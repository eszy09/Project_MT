import type { ComponentPropsWithoutRef, ReactNode } from "react";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type SurfaceProps = ComponentPropsWithoutRef<"div"> & {
  tone?: "default" | "active" | "danger";
};

export function Surface({ tone = "default", className, ...props }: SurfaceProps) {
  return (
    <div
      className={cn(
        "rounded-[2rem] border p-6 shadow-2xl shadow-black/30 backdrop-blur",
        tone === "default" && "border-white/10 bg-white/[0.045]",
        tone === "active" &&
          "border-lime-300/35 bg-lime-300/[0.08] shadow-lime-950/30",
        tone === "danger" && "border-red-400/30 bg-red-400/[0.08]",
        className,
      )}
      {...props}
    />
  );
}

export function Badge({ className, ...props }: ComponentPropsWithoutRef<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-lime-300/25 bg-lime-300/10 px-3 py-1 text-xs font-bold tracking-[0.18em] text-lime-200 uppercase",
        className,
      )}
      {...props}
    />
  );
}

type ActionLinkProps = ComponentPropsWithoutRef<"a"> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function ActionLink({
  variant = "primary",
  className,
  ...props
}: ActionLinkProps) {
  return (
    <a
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-2xl px-5 py-2 text-sm font-extrabold transition focus-visible:outline-2 focus-visible:outline-offset-2",
        variant === "primary" &&
          "bg-lime-300 text-slate-950 shadow-lg shadow-lime-500/20 hover:bg-lime-200 focus-visible:outline-lime-200",
        variant === "secondary" &&
          "border border-violet-300/30 bg-violet-400/10 text-violet-100 hover:bg-violet-400/15 focus-visible:outline-violet-200",
        variant === "ghost" &&
          "border border-white/15 bg-white/[0.03] text-slate-100 hover:bg-white/10 focus-visible:outline-white",
        className,
      )}
      {...props}
    />
  );
}

export function StatCard({
  label,
  value,
  detail,
  accent = "lime",
}: {
  label: string;
  value: string;
  detail: string;
  accent?: "lime" | "violet" | "cyan" | "orange";
}) {
  const accents = {
    lime: "text-lime-200 bg-lime-300/10 border-lime-300/20",
    violet: "text-violet-200 bg-violet-400/10 border-violet-300/20",
    cyan: "text-cyan-200 bg-cyan-400/10 border-cyan-300/20",
    orange: "text-orange-200 bg-orange-400/10 border-orange-300/20",
  };

  return (
    <div className={cn("rounded-3xl border p-5", accents[accent])}>
      <p className="text-xs font-bold tracking-[0.18em] uppercase opacity-80">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{detail}</p>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
      <div>
        <Badge>{eyebrow}</Badge>
        <h1 className="mt-5 max-w-4xl text-5xl font-black tracking-[-0.05em] text-balance sm:text-7xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}
