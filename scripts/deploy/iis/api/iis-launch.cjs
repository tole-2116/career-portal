// IIS entry for the API. The ASP.NET Core Module passes the port it proxies to in
// ASPNETCORE_PORT. Relative paths in the environment resolve against this folder.
const path = require("node:path");

process.chdir(__dirname);

process.env.PORT = process.env.ASPNETCORE_PORT || process.env.PORT || "5000";
process.env.HOST = process.env.HOST || "127.0.0.1";
process.env.DOTENV_CONFIG_PATH = path.resolve(__dirname, process.env.DOTENV_CONFIG_PATH || ".env");
process.env.UPLOAD_DIR = path.resolve(__dirname, process.env.UPLOAD_DIR || "uploads");

require("./dist/index.js");
