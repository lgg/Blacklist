// Build script: bundles the TypeScript entry points with esbuild and copies
// the static assets (HTML, CSS, icons, manifest) into a flat `build/` dir
// that can be loaded unpacked in Chrome or zipped for the Web Store.

import * as esbuild from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const outdir = resolve(root, "build");
const watch = process.argv.includes("--watch");

const entryPoints = {
  "service-worker": "src/service-worker.ts",
  popup: "src/popup/popup.ts",
  blocked: "src/blocked/blocked.ts",
};

/** Static files copied verbatim: [from, to] relative to root/outdir. */
const staticAssets = [
  ["src/manifest.json", "manifest.json"],
  ["src/popup/popup.html", "popup.html"],
  ["src/popup/popup.css", "popup.css"],
  ["src/blocked/blocked.html", "blocked.html"],
  ["src/blocked/blocked.css", "blocked.css"],
  ["icons", "icons"],
];

async function copyStatic() {
  await Promise.all(
    staticAssets.map(([from, to]) =>
      cp(resolve(root, from), resolve(outdir, to), { recursive: true }),
    ),
  );
}

const copyStaticPlugin = {
  name: "copy-static",
  setup(build) {
    build.onEnd(async (result) => {
      if (result.errors.length === 0) {
        await copyStatic();
        console.log(`Built extension → ${outdir}`);
      }
    });
  },
};

const options = {
  entryPoints,
  outdir,
  bundle: true,
  format: "esm",
  target: "chrome120",
  platform: "browser",
  sourcemap: watch ? "inline" : false,
  minify: !watch,
  logLevel: "info",
  plugins: [copyStaticPlugin],
};

await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log("Watching for changes...");
} else {
  await esbuild.build(options);
}
