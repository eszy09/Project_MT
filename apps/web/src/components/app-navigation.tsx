"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "./ui";

const navigationItems = [
  { label: "Dashboard", href: "/dashboard", match: "/dashboard" },
  { label: "Workout", href: "/workouts/active", match: "/workouts" },
  { label: "Routines", href: "/routines", match: "/routines" },
  { label: "Check-in", href: "/check-ins/new", match: "/check-ins" },
  { label: "Progress", href: "/progress", match: "/progress" },
  { label: "Journal", href: "/journal", match: "/journal" },
  { label: "Settings", href: "/settings", match: "/settings" },
] as const;

export function AppNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="w-full overflow-x-auto">
      <div className="flex min-w-max items-center gap-1 rounded-full border border-white/10 bg-white/[0.035] p-1">
        {navigationItems.map((item) => {
          const active =
            pathname === item.match || pathname.startsWith(`${item.match}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-black tracking-tight transition",
                active
                  ? "bg-lime-300 text-slate-950 shadow-lg shadow-lime-500/20"
                  : "text-slate-300 hover:bg-white/10 hover:text-white",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
