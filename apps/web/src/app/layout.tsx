import type { Metadata } from "next";
import Link from "next/link";
import { AppNavigation } from "@/components";
import { AuthNavigation } from "@/features/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Project_MT",
    template: "%s | Project_MT",
  },
  description:
    "A visual-first strength training and body-recomposition platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main-content"
          className="sr-only rounded-md bg-white p-3 text-black focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50"
        >
          Skip to main content
        </a>

        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-[#03040b]/88 backdrop-blur-xl">
            <div className="mx-auto grid w-full max-w-7xl gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between gap-4">
                <Link href="/" className="group flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-2xl border border-lime-300/35 bg-lime-300/12 text-sm font-black text-lime-200 shadow-lg shadow-lime-500/15">
                    MT
                  </span>
                  <span className="text-lg font-black tracking-[-0.04em]">
                    Project_MT
                  </span>
                </Link>

                <AuthNavigation />
              </div>

              <AppNavigation />
            </div>
          </header>

          <main
            id="main-content"
            className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-7 sm:px-6 lg:px-8"
          >
            {children}
          </main>

          <footer className="border-t border-white/10 px-4 py-5 text-center text-sm text-slate-500">
            Project_MT — train, check in, progress.
          </footer>
        </div>
      </body>
    </html>
  );
}
