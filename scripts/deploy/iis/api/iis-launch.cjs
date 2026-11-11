// IIS entry for the API. The ASP.NET Core Module passes the port it proxies to in
// ASPNETCORE_PORT. Relative paths in the environment resolve against this folder.
const http = require("node:http");
const path = require("node:path");

process.chdir(__dirname);

process.env.PORT = process.env.ASPNETCORE_PORT || process.env.PORT || "5000";
process.env.HOST = process.env.HOST || "127.0.0.1";
process.env.DOTENV_CONFIG_PATH = path.resolve(__dirname, process.env.DOTENV_CONFIG_PATH || ".env");
process.env.UPLOAD_DIR = path.resolve(__dirname, process.env.UPLOAD_DIR || "uploads");

// Extra public prefixes for the API (e.g. API_PATH_ALIASES="/WebApi"). IIS forwards the full
// request path, so an IIS application "/WebApi" pointing at this folder receives
// "/WebApi/jobs"; it is rewritten to "/api/jobs" before Express routes it.
const aliases = (process.env.API_PATH_ALIASES || "")
  .split(",")
  .map((alias) => alias.trim().replace(/\/+$/, ""))
  .filter((alias) => alias.startsWith("/") && alias.toLowerCase() !== "/api");

if (aliases.length > 0) {
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
