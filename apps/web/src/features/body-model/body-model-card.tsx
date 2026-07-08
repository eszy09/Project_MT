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
import { BodyModelRegionControls } from "./body-model-region-controls";
import {
  DEFAULT_BODY_MODEL_REGION_ID,
  type BodyModelRegionId,
  type BodyModelView,
  findBodyModelRegion,
} from "./body-model-regions";

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
  const [selectedRegionId, setSelectedRegionId] = useState<BodyModelRegionId>(
    DEFAULT_BODY_MODEL_REGION_ID,
  );
  const [view, setView] = useState<BodyModelView>("front");
  const [retryKey, setRetryKey] = useState(0);
  const selectedRegion = findBodyModelRegion(selectedRegionId);

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
      className="mt-8 overflow-hidden rounded-[2rem] border border-lime-300/20 bg-lime-300/[0.06] p-5 shadow-2xl shadow-black/20"
    >
      <div>
        <p className="text-sm font-black tracking-[0.18em] text-lime-200 uppercase">
          Approximate visualization
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-tight">
          Interactive body model
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          Rotate and zoom the model to understand its regions. This is a visual
          aid based on recorded measurements, not a clinical body scan. The
          buttons below provide the same muscle-area selection without needing
          the canvas.
        </p>
      </div>

      <div className="mt-5 space-y-5">
        <BodyModelRegionControls
          selectedRegionId={selectedRegionId}
          view={view}
          onSelectRegion={setSelectedRegionId}
          onChangeView={setView}
        />

        {capability.mode === "static" ? (
          <BodyModelFallback
            reason={capability.reason ?? "Static view selected."}
            selectedLabel={selectedRegion.label}
          />
        ) : !visible ? (
          <BodyModelLoading message="3D model will load when it enters view." />
        ) : (
          <BodyModelErrorBoundary
            key={retryKey}
            onRetry={() => setRetryKey((value) => value + 1)}
          >
            <LazyBodyModelCanvas
              selectedRegionId={selectedRegionId}
              view={view}
              onSelectRegion={setSelectedRegionId}
              reducedMotion={capability.reason?.includes("reduced motion")}
            />
          </BodyModelErrorBoundary>
        )}
      </div>
    </article>
  );
}

export function BodyModelLoading({
  message = "Loading interactive model...",
}: {
  message?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-96 items-center justify-center rounded-3xl border border-white/10 bg-slate-950/70 p-6 text-slate-300"
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
          reason="The 3D asset could not be loaded. The static view keeps workout logging and progress information available."
        />
        <button
          type="button"
          onClick={this.props.onRetry}
          className="mx-auto mt-3 block min-h-11 rounded-2xl border border-white/15 px-4 font-black transition hover:bg-white/10"
        >
          Retry interactive model
        </button>
      </div>
    );
  }
}
