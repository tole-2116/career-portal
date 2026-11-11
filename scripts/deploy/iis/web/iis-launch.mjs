// IIS entry for the web app. The ASP.NET Core Module passes the port it proxies to in
// ASPNETCORE_PORT; Nitro's node-server reads NITRO_PORT/PORT and NITRO_HOST/HOST.
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.dirname(fileURLToPath(import.meta.url));
process.chdir(appDir);

const port = process.env.ASPNETCORE_PORT || process.env.PORT || "3000";
const host = process.env.HOST || "127.0.0.1";
process.env.PORT = process.env.NITRO_PORT = port;
process.env.HOST = process.env.NITRO_HOST = host;

await import("./server/index.mjs");
