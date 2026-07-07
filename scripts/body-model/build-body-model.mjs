import { createHash } from "node:crypto";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import convertFbx from "@cocos/fbx2gltf";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "../..");
const source = path.join(
  root,
  "assets/body-model/source/project-mt-body-v1.fbx",
);
const outputDirectory = path.join(root, "apps/web/public/models");
const temporary = path.join(outputDirectory, "project-mt-body-v1.converted.glb");
const output = path.join(outputDirectory, "project-mt-body-v1.glb");
const manifestPath = path.join(outputDirectory, "project-mt-body-v1.json");
const byteBudget = 250_000;

await run(process.execPath, [
  path.join(scriptDirectory, "generate-source-fbx.mjs"),
]);
await mkdir(outputDirectory, { recursive: true });
await rm(temporary, { force: true });
await rm(output, { force: true });

await convertFbx(source, temporary, [
  "--binary",
  "--compute-normals",
  "always",
  "--pbr-metallic-roughness",
  "--keep-attribute",
  "position",
  "--keep-attribute",
  "normal",
]);

await run(process.execPath, [
  path.join(root, "node_modules/@gltf-transform/cli/bin/cli.js"),
  "meshopt",
  temporary,
  output,
  "--level",
  "medium",
]);
await rm(temporary, { force: true });

const bytes = await readFile(output);
if (bytes.subarray(0, 4).toString("ascii") !== "glTF") {
  throw new Error("Generated body model is not a binary glTF file.");
}
if (bytes.byteLength > byteBudget) {
  throw new Error(
    `Body model is ${bytes.byteLength} bytes, above the ${byteBudget}-byte budget.`,
  );
}

const sourceBytes = await readFile(source);
const manifest = {
  asset: "/models/project-mt-body-v1.glb",
  source: "assets/body-model/source/project-mt-body-v1.fbx",
  sourceSha256: hash(sourceBytes),
  outputSha256: hash(bytes),
  outputBytes: (await stat(output)).size,
  byteBudget,
  compression: "EXT_meshopt_compression",
  textures: "none",
  regions: [
    "region_head",
    "region_chest",
    "region_back",
    "region_core",
    "region_left_arm",
    "region_right_arm",
    "region_left_leg",
    "region_right_leg",
  ],
};
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(
  `Built ${path.relative(root, output)} (${manifest.outputBytes} / ${byteBudget} bytes)`,
);

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function run(command, arguments_) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, arguments_, {
      cwd: root,
      stdio: "inherit",
      shell: false,
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}.`));
    });
  });
}
