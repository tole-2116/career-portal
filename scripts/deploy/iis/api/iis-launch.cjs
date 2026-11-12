// IIS entry for the API (ASP.NET Core Module V2, out-of-process). Works with a plain
// "Add Application" in IIS Manager — nothing has to be configured in web.config:
//   - port: ASPNETCORE_PORT from the module;
//   - settings: the first existing file of DOTENV_CONFIG_PATH, ..\data\api.env, .\.env
//     (only DATABASE_URL is required);
//   - JWT_SECRET: generated once into jwt-secret.txt next to that file when not set;
//   - uploads: UPLOAD_DIR, default ..\data\uploads;
//   - database schema: `prisma migrate deploy` on start (AUTO_MIGRATE=false to skip);
//   - path: the IIS application path (ASPNETCORE_APPL_PATH, e.g. /WebApi) and API_PATH_ALIASES
//     are served as /api, so the application may have any name.
const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

process.chdir(__dirname);
const log = (message) => console.log(`[iis-launch] ${message}`);

process.env.PORT = process.env.ASPNETCORE_PORT || process.env.PORT || "5000";
process.env.HOST = process.env.HOST || "127.0.0.1";
process.env.NODE_ENV = process.env.NODE_ENV || "production";

// ---- settings file ----------------------------------------------------------------------
const envCandidates = [
  process.env.DOTENV_CONFIG_PATH,
  path.join("..", "data", "api.env"),
  ".env",
].filter(Boolean).map((file) => path.resolve(__dirname, file));
const envFile = envCandidates.find((file) => fs.existsSync(file));
if (!envFile) {
  console.error(`[iis-launch] No settings file. Create ${envCandidates[1]} with DATABASE_URL=... (see api.env.example).`);
  process.exit(1);
}
process.env.DOTENV_CONFIG_PATH = envFile;
for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
  const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
  if (!match || line.trim().startsWith("#")) continue;
  let value = match[2];
  if (/^(["']).*\1$/.test(value)) value = value.slice(1, -1);
  else value = value.replace(/\s+#.*$/, "");
  if (process.env[match[1]] === undefined) process.env[match[1]] = value;
}
log(`settings: ${envFile}`);
if (!process.env.DATABASE_URL) {
  console.error(`[iis-launch] DATABASE_URL is missing in ${envFile}.`);
  process.exit(1);
}

if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET, "utf8") < 32) {
  const secretFile = path.join(path.dirname(envFile), "jwt-secret.txt");
  if (!fs.existsSync(secretFile)) {
    fs.writeFileSync(secretFile, crypto.randomBytes(48).toString("base64"), { mode: 0o600 });
    log(`generated ${secretFile}`);
  }
  process.env.JWT_SECRET = fs.readFileSync(secretFile, "utf8").trim();
}

process.env.UPLOAD_DIR = path.resolve(__dirname, process.env.UPLOAD_DIR || path.join("..", "data", "uploads"));

// ---- database migrations ----------------------------------------------------------------
if ((process.env.AUTO_MIGRATE || "true").toLowerCase() !== "false") {
  const cli = path.join(__dirname, "node_modules", "prisma", "build", "index.js");
  if (!fs.existsSync(cli)) {
    log("prisma CLI not bundled, skipping migrations");
  } else {
    const engines = path.join(__dirname, "node_modules", "@prisma", "engines");
    const schemaEngine = fs.readdirSync(engines).find((f) => f.startsWith("schema-engine"));
    const queryEngine = fs.readdirSync(path.join(__dirname, "node_modules", ".prisma", "client"))
      .find((f) => f.startsWith("query_engine") && f.endsWith(".node"));
    const started = Date.now();
    const result = spawnSync(
      process.execPath,
      [cli, "migrate", "deploy", "--schema", path.join(__dirname, "prisma", "schema.prisma")],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          CHECKPOINT_DISABLE: "1",
          PRISMA_HIDE_UPDATE_MESSAGE: "1",
          PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING: "1",
          ...(schemaEngine ? { PRISMA_SCHEMA_ENGINE_BINARY: path.join(engines, schemaEngine) } : {}),
          ...(queryEngine
            ? { PRISMA_QUERY_ENGINE_LIBRARY: path.join(__dirname, "node_modules", ".prisma", "client", queryEngine) }
            : {}),
        },
      },
    );
    const output = `${result.stdout || ""}${result.stderr || ""}`.trim();
    if (result.status !== 0) {
      console.error(`[iis-launch] prisma migrate deploy failed (exit ${result.status}):\n${output || result.error}`);
      process.exit(1);
    }
    log(`database schema checked (${Date.now() - started} ms)`);
    if (/applied|following migration/i.test(output)) console.log(output);
  }
}

// ---- public path aliases ----------------------------------------------------------------
// IIS forwards the full request path, so an application "/WebApi" pointing at this folder
// receives "/WebApi/jobs"; it is rewritten to "/api/jobs" before Express routes it.
const aliases = [...(process.env.API_PATH_ALIASES || "").split(","), process.env.ASPNETCORE_APPL_PATH || ""]
  .map((alias) => alias.trim().replace(/\/+$/, ""))
  .filter((alias) => alias.startsWith("/") && alias.toLowerCase() !== "/api");

if (aliases.length > 0) {
  log(`also serving ${aliases.join(", ")} as /api`);
  const emit = http.Server.prototype.emit;
  http.Server.prototype.emit = function emitWithApiAliases(event, request, ...rest) {
    if (event === "request" && request && typeof request.url === "string") {
      const lower = request.url.toLowerCase();
      for (const alias of aliases) {
        const prefix = alias.toLowerCase();
        if (lower === prefix || lower.startsWith(prefix + "/") || lower.startsWith(prefix + "?")) {
          request.url = "/api" + request.url.slice(alias.length);
          break;
        }
      }
    }
    return emit.call(this, event, request, ...rest);
  };
}

require("./dist/index.js");
