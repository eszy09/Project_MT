"use client";

import { Suspense } from "react";
import { Html, OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

const MODEL_PATH = "/models/project-mt-body-v1.glb";

export default function BodyModelCanvas() {
  const { active, progress } = useProgress();

  return (
    <div className="relative min-h-96 overflow-hidden rounded-xl bg-slate-950/70">
      <Canvas
        camera={{ position: [4.3, 2.4, 6.5], fov: 38 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={1.7} />
        <directionalLight position={[4, 6, 5]} intensity={2.5} />
        <Suspense fallback={<CanvasProgress />}>
          <BodyModel />
        </Suspense>
        <OrbitControls
          makeDefault
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

function BodyModel() {
  const { scene } = useGLTF(MODEL_PATH, false, true);
  return <primitive object={scene} position={[0, -0.6, 0]} />;
}

function CanvasProgress() {
  return (
    <Html center>
      <span className="rounded-lg bg-slate-950/90 px-4 py-2 text-sm whitespace-nowrap">
        Preparing model…
      </span>
    </Html>
  );
}
