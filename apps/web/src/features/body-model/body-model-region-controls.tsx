import {
  BODY_MODEL_REGIONS,
  type BodyModelRegionId,
  type BodyModelView,
  findBodyModelRegion,
} from "./body-model-regions";

export function BodyModelRegionControls({
  selectedRegionId,
  view,
  onSelectRegion,
  onChangeView,
}: {
  selectedRegionId: BodyModelRegionId;
  view: BodyModelView;
  onSelectRegion: (regionId: BodyModelRegionId) => void;
  onChangeView: (view: BodyModelView) => void;
}) {
  const selectedRegion = findBodyModelRegion(selectedRegionId);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div>
        <fieldset>
          <legend className="text-sm font-semibold text-slate-200">
            Model side
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["front", "back"] as const).map((side) => (
              <button
                key={side}
                type="button"
                aria-pressed={view === side}
                onClick={() => onChangeView(side)}
                className="min-h-11 rounded-lg border border-white/15 px-4 text-sm font-semibold capitalize data-[selected=true]:border-emerald-300 data-[selected=true]:bg-emerald-300/15 data-[selected=true]:text-emerald-100"
                data-selected={view === side}
              >
                {side} view
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-4">
          <legend className="text-sm font-semibold text-slate-200">
            Select a muscle area
          </legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {BODY_MODEL_REGIONS.map((region) => (
              <button
                key={region.id}
                type="button"
                aria-pressed={selectedRegionId === region.id}
                onClick={() => {
                  onChangeView(region.view);
                  onSelectRegion(region.id);
                }}
                className="min-h-11 rounded-lg border border-white/15 px-3 text-left text-sm font-semibold text-slate-200 data-[selected=true]:border-emerald-300 data-[selected=true]:bg-emerald-300/15 data-[selected=true]:text-emerald-100"
                data-selected={selectedRegionId === region.id}
              >
                {region.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <aside
        aria-live="polite"
        className="rounded-xl border border-white/10 bg-slate-950/70 p-4"
      >
        <p className="text-xs font-semibold tracking-widest text-emerald-300 uppercase">
          Selected area
        </p>
        <h3 className="mt-2 text-lg font-bold">{selectedRegion.label}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          {selectedRegion.summary}
        </p>
        <p className="mt-3 font-mono text-xs text-slate-500">
          Canonical ID: {selectedRegion.id}
        </p>
      </aside>
    </div>
  );
}
