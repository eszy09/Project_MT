import type { Metadata } from "next";
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
          <header className="border-b border-white/10 bg-slate-950">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <span className="text-lg font-semibold tracking-tight">
                Project_MT
              </span>

              <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
                Foundation
              </span>
            </div>
          </header>

          <main
            id="main-content"
            className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8"
          >
            {children}
          </main>

          <footer className="border-t border-white/10 px-4 py-6 text-center text-sm text-slate-400">
            Project_MT — visual-first training and progress tracking
          </footer>
        </div>
      </body>
    </html>
  );
}
