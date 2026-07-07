# Body model asset pipeline

## Purpose

The browser receives a compact runtime GLB, never the editable FBX source.
Named meshes are preserved so interaction code can map visual regions to
accessible controls.

## Reproducible flow

```text
deterministic Three.js geometry
  -> binary FBX source
  -> FBX2glTF conversion
  -> glTF Transform Meshopt compression and quantization
  -> GLB + provenance manifest
```

Run:

```powershell
npm run build:body-model
npm run check:body-model
```

The checker verifies the GLB header, byte size, source and output SHA-256
hashes, Meshopt requirement, texture strategy, mesh count, and all named body
regions.

## Approved budget

| Constraint | Budget | Current strategy |
| --- | ---: | --- |
| Runtime GLB transfer | 250 KB maximum | Meshopt-compressed binary glTF |
| Geometry | 1,500 rendered triangles maximum | Low-poly regional primitives |
| Textures | 0 bytes in version 1 | Material colors only |
| Device pixel ratio | 1.5 maximum | Capped in the Three.js canvas |

If textures are introduced later, use WebP or KTX2, limit each dimension to
1024 pixels, and keep the complete GLB under the same transfer budget unless
production measurements approve a new budget.

## Runtime delivery

- The canvas code is dynamically imported and mounted only near the viewport.
- The UI reports loading progress and catches render or asset failures.
- WebGL absence, reduced-motion preferences, and low-resource devices receive
  a static body diagram.
- The model is explicitly labeled as an approximation, not a clinical scan.

## Licensing and provenance

The project-owned source and build-tool licenses are recorded in
`assets/body-model/LICENSE.md`. The generated manifest stores source and output
hashes so an output can be traced to the approved FBX.
