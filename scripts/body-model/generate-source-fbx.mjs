import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FBXExporter } from "@comfyorg/fbx-exporter-three";
import * as THREE from "three";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const output = path.join(
  root,
  "assets/body-model/source/project-mt-body-v1.fbx",
);
const scene = new THREE.Scene();
scene.name = "Project_MT_body_model_source";

const regions = [
  region("region_head", [0.6, 0.6, 0.6], [0, 2.75, 0], 0xa3b8cc),
  region("region_chest", [1.3, 1.15, 0.36], [0, 1.825, 0.18], 0x33d1a8),
  region("region_back", [1.3, 1.15, 0.36], [0, 1.825, -0.18], 0x2da3c7),
  region("region_core", [1, 0.8, 0.6], [0, 0.85, 0], 0xf0ad42),
  region("region_left_arm", [0.38, 1.6, 0.44], [-0.86, 1.5, 0], 0x7ab8eb),
  region("region_right_arm", [0.38, 1.6, 0.44], [0.86, 1.5, 0], 0x7ab8eb),
  region("region_left_leg", [0.43, 2.2, 0.56], [-0.265, -0.65, 0], 0x947ad9),
  region("region_right_leg", [0.43, 2.2, 0.56], [0.265, -0.65, 0], 0x947ad9),
];
scene.add(...regions);
scene.updateMatrixWorld(true);

const exporter = new FBXExporter();
const bytes = exporter.parseSync(scene, {
  preset: "threejs",
  version: 7400,
  unitScale: 1,
  embedTextures: false,
});
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, bytes);
console.log(`Generated ${path.relative(root, output)} (${bytes.byteLength} bytes)`);

function region(name, dimensions, position, color) {
  const centimeters = dimensions.map((value) => value * 100);
  const geometry = new THREE.BoxGeometry(...centimeters, 2, 2, 2);
  const material = new THREE.MeshStandardMaterial({
    name: `${name}_material`,
    color,
    roughness: 0.72,
    metalness: 0,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(...position.map((value) => value * 100));
  return mesh;
}
