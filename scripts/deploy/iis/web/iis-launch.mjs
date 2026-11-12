// IIS entry for the web app (ASP.NET Core Module V2, out-of-process). The module passes the
// port it proxies to in ASPNETCORE_PORT; Nitro's node-server reads NITRO_PORT/PORT and
// NITRO_HOST/HOST.
//
// Works with a plain "Add Website" in IIS Manager (+ an application "api" on the api folder),
// nothing to configure:
//   - SSR calls to /api/... go back through IIS to the same site the visitor used (the
//     request's Host header and X-Forwarded-Proto), over loopback. Set API_INTERNAL_URL in
//     web.config only to force another address.
//   - /uploads/* (CVs, news images) is served by the API: it is forwarded to /api/uploads/*.
import { AsyncLocalStorage } from "node:async_hooks";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";

const appDir = path.dirname(fileURLToPath(import.meta.url));
process.chdir(appDir);

const port = process.env.ASPNETCORE_PORT || process.env.PORT || "3000";
const host = process.env.HOST || "127.0.0.1";
process.env.PORT = process.env.NITRO_PORT = port;
process.env.HOST = process.env.NITRO_HOST = host;

// Placeholder origin used by src/lib/api/request.ts on the server; replaced per request below.
const SELF = "http://iis-site.invalid";
const configured = process.env.API_INTERNAL_URL?.trim();
if (!configured || configured === "http://localhost") process.env.API_INTERNAL_URL = SELF;

const incoming = new AsyncLocalStorage();

/** Public origin of the current request as IIS received it. */
function originOf(req) {
  const proto = String(req.headers["x-forwarded-proto"] || "http").split(",")[0].trim().toLowerCase();
  return { proto: proto === "https" ? "https" : "http", host: String(req.headers.host || "localhost") };
}

/** Sends a request to this IIS site over loopback, keeping the public Host name (bindings). */
function requestSite(origin, method, pathAndQuery, headers) {
  const secure = origin.proto === "https";
  const hostname = origin.host.replace(/:\d+$/, "").replace(/^\[|\]$/g, "");
  const portMatch = /:(\d+)$/.exec(origin.host);
  const transport = secure ? https : http;
  return transport.request({
    host: "127.0.0.1",
    port: portMatch ? Number(portMatch[1]) : secure ? 443 : 80,
    method,
    path: pathAndQuery,
    headers: { ...headers, host: origin.host },
    ...(secure ? { servername: /^[\d.]+$/.test(hostname) ? undefined : hostname } : {}),
  });
}

// ---- SSR fetch to the API ----------------------------------------------------------------
const realFetch = globalThis.fetch;
globalThis.fetch = async function fetchThroughIis(input, init) {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input?.url;
  if (typeof url !== "string" || !url.startsWith(SELF + "/")) return realFetch(input, init);

  const origin = incoming.getStore();
  if (!origin) throw new Error("API call outside a request: set API_INTERNAL_URL in web\\web.config.");
  const pathAndQuery = url.slice(SELF.length);
  const request = new Request(new URL(pathAndQuery, `${origin.proto}://${origin.host}`), input instanceof Request ? input : init);
  const body = request.body ? Buffer.from(await request.arrayBuffer()) : undefined;
  const headers = Object.fromEntries(request.headers);
  if (body) headers["content-length"] = String(body.length);

  try {
    return await new Promise((resolve, reject) => {
      const req = requestSite(origin, request.method, pathAndQuery, headers);
      req.on("response", (res) => {
        const responseHeaders = new Headers();
        for (const [key, value] of Object.entries(res.headers)) {
          if (Array.isArray(value)) value.forEach((v) => responseHeaders.append(key, v));
          else if (value !== undefined) responseHeaders.set(key, value);
        }
        const empty = request.method === "HEAD" || res.statusCode === 204 || res.statusCode === 304;
        resolve(new Response(empty ? null : Readable.toWeb(res), {
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: responseHeaders,
        }));
      });
      req.on("error", reject);
      req.setTimeout(60_000, () => req.destroy(new Error("API request timed out")));
      req.end(body);
    });
  } catch (error) {
    // Loopback refused (e.g. the binding is on a specific IP): try the public address.
    if (error?.code === "ECONNREFUSED") return realFetch(request.url, { method: request.method, headers, body });
    throw error;
  }
};

// ---- per-request context + /uploads forwarding -------------------------------------------
const emit = http.Server.prototype.emit;
http.Server.prototype.emit = function emitWithContext(event, req, res, ...rest) {
  if (event !== "request" || !req || typeof req.url !== "string") return emit.call(this, event, req, res, ...rest);
  const origin = originOf(req);

  if (/^\/uploads\//i.test(req.url) && (req.method === "GET" || req.method === "HEAD")) {
    const headers = { ...req.headers };
    delete headers.connection;
    const upstream = requestSite(origin, req.method, "/api" + req.url, headers);
    upstream.on("response", (up) => {
      res.writeHead(up.statusCode || 502, up.headers);
      up.pipe(res);
    });
    upstream.on("error", (error) => {
      if (!res.headersSent) res.writeHead(502, { "content-type": "text/plain" });
      res.end(`Uploads unavailable: ${error.message}`);
    });
    upstream.end();
    return true;
  }

  return incoming.run(origin, () => emit.call(this, event, req, res, ...rest));
};

await import("./server/index.mjs");
