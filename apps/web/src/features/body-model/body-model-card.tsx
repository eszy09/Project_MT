"use client";

import dynamic from "next/dynamic";
import {
  Component,
  type ErrorInfo,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { detectBodyModelCapability } from "./body-model-capability";
import { BodyModelFallback } from "./body-model-fallback";

const LazyBodyModelCanvas = dynamic(() => import("./body-model-canvas"), {
  ssr: false,
  loading: () => <BodyModelLoading />,
});

export function BodyModelCard() {
  const container = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(
    () => typeof window !== "undefined" && !("IntersectionObserver" in window),
  );
  const [capability] = useState(() => detectBodyModelCapability());
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  return (
    <article
      ref={container}
      className="mt-8 rounded-2xl border border-emerald-300/20 bg-emerald-300/5 p-5"
    >
      <div>
        <p className="text-sm font-semibold text-emerald-200">
          Approximate visualization
        </p>
        <h2 className="mt-1 text-2xl font-bold">Interactive body model</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          Rotate and zoom the model to understand its regions. This is a visual
          aid based on recorded measurements, not a clinical body scan.
        </p>
      </div>

      <div className="mt-5">
        {capability.mode === "static" ? (
          <BodyModelFallback
            reason={capability.reason ?? "Static view selected."}
          />
        ) : !visible ? (
          <BodyModelLoading message="3D model will load when it enters view." />
        ) : (
          <BodyModelErrorBoundary
            key={retryKey}
            onRetry={() => setRetryKey((value) => value + 1)}
          >
            <LazyBodyModelCanvas />
          </BodyModelErrorBoundary>
        )}
      </div>
    </article>
  );
}

export function BodyModelLoading({
  message = "Loading interactive model…",
}: {
  message?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-96 items-center justify-center rounded-xl bg-slate-950/70 p-6 text-slate-300"
    >
      {message}
    </div>
  );
}

class BodyModelErrorBoundary extends Component<
  { children: ReactNode; onRetry: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Body model failed to render.", {
      errorType: error.name,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div>
        <BodyModelFallback
          failed
          reason="The 3D asset could not be loaded. The static view keeps progress information available."
        />
        <button
          type="button"
          onClick={this.props.onRetry}
          className="mx-auto mt-3 block min-h-11 rounded-lg border border-white/15 px-4 font-semibold"
        >
          Retry interactive model
        </button>
      </div>
    );
  }
}
