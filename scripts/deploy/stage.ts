/**
 * Stages a self-contained IIS release at deploy/career-portal:
 *
 *   career-portal/
 *     data/api.env.example settings template: copy to data/api.env and set DATABASE_URL
 *     tools/               optional helper scripts (check-site, reset-admin-password, ...)
 *     deploy.ps1, setup-iis.ps1  alternative versioned-release deploy
 *     README.md       deployment guide
 *     web/            Nitro node-server output + web.config + iis-launch.mjs
 *     api/            bundled Express API (dist/index.js) + Prisma client/engine
 *                     + prisma schema/migrations + web.config + iis-launch.cjs
 *
 * Runs after `turbo run build` (needs apps/web/.output). The API is bundled with Bun into a
 * single CommonJS file so the server needs no workspace symlinks or TypeScript sources; only
 * Prisma stays external because it loads a native query engine at runtime.
 */
import { access, cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

import { defaultFormConfig } from "../../apps/api/src/defaults/form-config.defaults";
import { siteConfigSeed } from "../../apps/api/src/defaults/site-config.seed";

const root = path.resolve(import.meta.dir, "../..");
const templates = path.join(import.meta.dir, "iis");
const outDir = path.join(root, "deploy", "career-portal");
const webOut = path.join(outDir, "web");
const apiOut = path.join(outDir, "api");

async function exists(p: string) {
  return access(p).then(
    () => true,
    () => false,
  );
}

async function stageWeb() {
  const nitroOutput = path.join(root, "apps/web/.output");
  if (!(await exists(path.join(nitroOutput, "server/index.mjs")))) {
    throw new Error("apps/web/.output/server/index.mjs not found — build the web app first.");
  }
  const nitro = JSON.parse(await readFile(path.join(nitroOutput, "nitro.json"), "utf8"));
  if (nitro.preset !== "node-server") {
    throw new Error(`Web was built with Nitro preset "${nitro.preset}"; IIS hosting needs "node-server".`);
  }

  await cp(nitroOutput, webOut, { recursive: true });
  await cp(path.join(templates, "web"), webOut, { recursive: true });
}

async function stageApi() {
  const result = await Bun.build({
    entrypoints: [path.join(root, "apps/api/src/index.ts")],
    outdir: path.join(apiOut, "dist"),
    naming: "index.js",
    target: "node",
    format: "cjs",
    sourcemap: "linked",
    minify: { whitespace: true, syntax: true, identifiers: false },
    external: ["@prisma/client", ".prisma/client"],
    // Bun otherwise inlines the build machine's NODE_ENV (development), which turned off
    // production checks (JWT_SECRET length, Secure/strict cookies) in the release.
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
  });
  if (!result.success) {
    for (const log of result.logs) console.error(log);
    throw new Error("API bundle failed.");
  }

  // Prisma: copy the runtime package and the generated client (with its native engine).
  const requireFromDb = createRequire(path.join(root, "packages/database/package.json"));
  const prismaClientDir = path.dirname(requireFromDb.resolve("@prisma/client/package.json"));
  const generatedClientDir = path.resolve(prismaClientDir, "../../.prisma/client");
  if (!(await exists(path.join(generatedClientDir, "schema.prisma")))) {
    throw new Error(`Generated Prisma client not found at ${generatedClientDir} — run db:generate.`);
  }
  // Skip leftovers of interrupted `prisma generate` runs (query_engine-*.node.tmp1234, ~20 MB
  // each) and the WASM engines, which are only used with driver adapters.
  const prismaFilter = (source: string) => !/\.tmp\d*$/.test(source) && !source.endsWith(".wasm");
  await cp(prismaClientDir, path.join(apiOut, "node_modules/@prisma/client"), {
    recursive: true,
    dereference: true,
    filter: prismaFilter,
  });
  await cp(generatedClientDir, path.join(apiOut, "node_modules/.prisma/client"), {
    recursive: true,
    dereference: true,
    filter: prismaFilter,
  });
  const engines = (await readdir(generatedClientDir)).filter((f) => f.startsWith("query_engine"));
  if (!engines.some((f) => f.includes("windows"))) {
    console.warn(
      `WARNING: no Windows Prisma query engine in the generated client (found: ${engines.join(", ") || "none"}).` +
        ' Build on Windows, or add binaryTargets = ["native", "windows"] to schema.prisma.',
    );
  }

  // Prisma CLI (+ schema engine) so iis-launch.cjs can run `prisma migrate deploy` on start
  // without Internet. Query engines are skipped: the generated client already ships one.
  const cliFilter = (source: string) => prismaFilter(source) || source.endsWith("prisma_schema_build_bg.wasm");
  const withoutQueryEngine = (source: string) => cliFilter(source) && !/query_engine-[^\\/]*\.node$/.test(source);
  await copyPackageClosure(requireFromDb, "prisma", path.join(apiOut, "node_modules"), withoutQueryEngine);

  // Schema + migrations so `prisma migrate deploy` can run against production.
  await cp(path.join(root, "packages/database/prisma"), path.join(apiOut, "prisma"), {
    recursive: true,
    filter: (source) => !source.endsWith(".ts"),
  });

  await cp(path.join(templates, "api"), apiOut, { recursive: true });
  await writeFile(
    path.join(apiOut, "package.json"),
    JSON.stringify({ name: "career-portal-api", private: true, type: "commonjs" }, null, 2) + "\n",
  );
}

/** Copies a package and its runtime dependencies (not optional ones) into `targetModules`. */
async function copyPackageClosure(
  requireFrom: NodeJS.Require,
  name: string,
  targetModules: string,
  filter: (source: string) => boolean,
) {
  const seen = new Set<string>();
  const queue: Array<{ name: string; from: NodeJS.Require }> = [{ name, from: requireFrom }];
  while (queue.length > 0) {
    const next = queue.shift()!;
    if (seen.has(next.name)) continue;
    seen.add(next.name);
    const manifestPath = next.from.resolve(`${next.name}/package.json`);
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as { dependencies?: Record<string, string> };
    await cp(path.dirname(manifestPath), path.join(targetModules, next.name), {
      recursive: true,
      dereference: true,
      filter: (source) => filter(source) && !source.includes(`${path.sep}node_modules${path.sep}.cache`),
    });
    const fromHere = createRequire(manifestPath);
    for (const dependency of Object.keys(manifest.dependencies ?? {})) queue.push({ name: dependency, from: fromHere });
  }
}

async function stageInstaller() {
  await mkdir(path.join(outDir, "data"), { recursive: true });
  await cp(path.join(templates, "api.env.example"), path.join(outDir, "data", "api.env.example"));
  const toolsOut = path.join(outDir, "tools");
  await cp(path.join(templates, "tools"), toolsOut, { recursive: true });
  // Default rows inserted by tools/seed-initial-data.ps1 on a new database (same as db:seed:prod).
  const seedData = {
    admin_name: "Quản trị viên",
    site_configs: [siteConfigSeed],
    form_configs: [defaultFormConfig],
  };
  await writeFile(path.join(toolsOut, "seed-data.json"), JSON.stringify(seedData, null, 2) + "\n");
}

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
await stageWeb();
await stageApi();
for (const file of ["setup-iis.ps1", "deploy.ps1"]) {
  await cp(path.join(templates, file), path.join(outDir, file));
}
await cp(path.join(templates, "README.md"), path.join(outDir, "README.md"));
await stageInstaller();

console.log(`IIS release staged in ${path.relative(root, outDir)}`);
