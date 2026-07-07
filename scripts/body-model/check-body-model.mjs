import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const manifestPath = path.join(
  root,
  "apps/web/public/models/project-mt-body-v1.json",
);
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const source = await readFile(path.join(root, manifest.source));
const output = await readFile(
  path.join(root, "apps/web/public", manifest.asset.replace(/^\//, "")),
);

assert(output.subarray(0, 4).toString("ascii") === "glTF", "GLB magic header");
assert(output.byteLength === manifest.outputBytes, "recorded output byte size");
assert(output.byteLength <= manifest.byteBudget, "asset byte budget");
assert(hash(source) === manifest.sourceSha256, "source SHA-256");
assert(hash(output) === manifest.outputSha256, "output SHA-256");
const gltf = parseGlbJson(output);
assert(gltf.meshes?.length === manifest.regions.length, "runtime mesh count");
assert(
  manifest.regions.every((region) =>
    gltf.meshes.some((mesh) => mesh.name === region),
  ),
  "named body regions",
);
assert(
  gltf.extensionsRequired?.includes("EXT_meshopt_compression"),
  "required Meshopt extension",
);
assert(
  manifest.compression === "EXT_meshopt_compression",
  "compression strategy",
);
assert(manifest.textures === "none", "texture strategy");
console.log(
  `Body model verified (${output.byteLength} / ${manifest.byteBudget} bytes).`,
);

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function parseGlbJson(value) {
  const jsonLength = value.readUInt32LE(12);
  const chunkType = value.subarray(16, 20).toString("ascii");
  assert(chunkType === "JSON", "GLB JSON chunk");
  return JSON.parse(value.subarray(20, 20 + jsonLength).toString("utf8"));
}

function assert(condition, label) {
  if (!condition) throw new Error(`Body model check failed: ${label}.`);
}
