"use client";

import { Suspense, useEffect, useMemo } from "react";
import { Html, OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { Mesh, MeshStandardMaterial, Object3D } from "three";

import {
  type BodyModelRegionId,
  type BodyModelView,
  findBodyModelRegionByMeshName,
} from "./body-model-regions";

const MODEL_PATH = "/models/project-mt-body-v1.glb";
const DEFAULT_MATERIAL_COLOR = "#94a3b8";
const SELECTED_MATERIAL_COLOR = "#6ee7b7";
const FRONT_CAMERA_POSITION: [number, number, number] = [4.3, 2.4, 6.5];
const BACK_CAMERA_POSITION: [number, number, number] = [-4.3, 2.4, -6.5];

export default function BodyModelCanvas({
  selectedRegionId,
  view,
  onSelectRegion,
  reducedMotion = false,
}: {
  selectedRegionId: BodyModelRegionId;
  view: BodyModelView;
  onSelectRegion: (regionId: BodyModelRegionId) => void;
  reducedMotion?: boolean;
}) {
  const { active, progress } = useProgress();

  return (
    <div className="relative min-h-96 overflow-hidden rounded-xl bg-slate-950/70">
      <Canvas
        key={view}
        camera={{
          position:
            view === "front" ? FRONT_CAMERA_POSITION : BACK_CAMERA_POSITION,
          fov: 38,
        }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={1.7} />
        <directionalLight position={[4, 6, 5]} intensity={2.5} />
        <Suspense fallback={<CanvasProgress />}>
          <BodyModel
            selectedRegionId={selectedRegionId}
            onSelectRegion={onSelectRegion}
          />
        </Suspense>
        <OrbitControls
          makeDefault
          enableRotate={!reducedMotion}
          enablePan={false}
          minDistance={4}
          maxDistance={10}
        />
      </Canvas>
      {active && (
        <div
          role="status"
          aria-live="polite"
          className="absolute inset-x-5 bottom-5 rounded-lg bg-slate-950/90 p-3"
        >
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-emerald-300 transition-[width]"
              style={{ width: `${Math.round(progress)}%` }}
            />
          </div>
          <p className="mt-2 text-center text-xs text-slate-300">
            Loading 3D model: {Math.round(progress)}%
          </p>
        </div>
      )}
    </div>
  );
}

function BodyModel({
  selectedRegionId,
  onSelectRegion,
}: {
  selectedRegionId: BodyModelRegionId;
  onSelectRegion: (regionId: BodyModelRegionId) => void;
}) {
  const { scene } = useGLTF(MODEL_PATH, false, true);
  const model = useMemo(() => prepareSelectableModel(scene), [scene]);

  useEffect(() => {
    model.traverse((object) => {
      if (!(object instanceof Mesh)) return;

      const region = findBodyModelRegionByMeshName(object.name);
      const material = object.material;
      if (!(material instanceof MeshStandardMaterial) || !region) return;

      const selected = region.id === selectedRegionId;
      material.color.set(
        selected ? SELECTED_MATERIAL_COLOR : DEFAULT_MATERIAL_COLOR,
      );
      material.emissive.set(selected ? SELECTED_MATERIAL_COLOR : "#000000");
      material.emissiveIntensity = selected ? 0.2 : 0;
    });
  }, [model, selectedRegionId]);

  return (
    <primitive
      object={model}
      position={[0, -0.6, 0]}
      onPointerDown={(event: ThreeEvent<PointerEvent>) => {
        const region = findRegionFromObject(event.object);
        if (!region) return;

        event.stopPropagation();
        onSelectRegion(region.id);
      }}
    />
  );
}

function CanvasProgress() {
  return (
    <Html center>
      <span className="rounded-lg bg-slate-950/90 px-4 py-2 text-sm whitespace-nowrap">
        Preparing model...
      </span>
    </Html>
  );
}

function prepareSelectableModel(scene: Object3D) {
  const model = scene.clone(true);
  model.traverse((object) => {
    if (!(object instanceof Mesh)) return;

    const material = object.material;
    if (material instanceof MeshStandardMaterial) {
      object.material = material.clone();
    }
  });
  return model;
}

function findRegionFromObject(object: Object3D) {
  let current: Object3D | null = object;
  while (current) {
    const region = findBodyModelRegionByMeshName(current.name);
    if (region) return region;
    current = current.parent;
  }
  return null;
}
