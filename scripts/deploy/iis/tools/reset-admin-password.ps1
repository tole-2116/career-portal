# Resets the password of an admin account directly on the server (no source code, no bun).
# Uses node.exe and the Prisma client shipped in <InstallDir>\api, reads DATABASE_URL from
# <InstallDir>\data\api.env, and hashes the password with bcrypt inside PostgreSQL (pgcrypto).
# Run in an elevated (Administrator) PowerShell.
#
#   powershell -ExecutionPolicy Bypass -File .\reset-admin-password.ps1
#   powershell -ExecutionPolicy Bypass -File .\reset-admin-password.ps1 -Email "hr@company.vn"

[CmdletBinding()]
param(
  # Default: the folder that contains this tools folder (e.g. D:\HRIS\DQC\Source\HRISCareer).
  [string]$InstallDir = "",
  [string]$Email = "admin@careerportal.com",
  [string]$NodePath = ""
)

# $PSScriptRoot is empty inside param defaults of advanced scripts on PowerShell 5.1.
if (-not $InstallDir) { $InstallDir = Split-Path -Parent $PSScriptRoot }

$ErrorActionPreference = "Stop"

$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw "Please run this script from PowerShell opened with 'Run as Administrator'."
}

$apiDir = Join-Path $InstallDir "api"
$envFile = Join-Path $InstallDir "data\api.env"
if (-not (Test-Path -LiteralPath (Join-Path $apiDir "node_modules\@prisma\client\package.json"))) {
  throw "Prisma client not found in $apiDir\node_modules. Is the site installed in $InstallDir?"
}
if (-not (Test-Path -LiteralPath $envFile)) { throw "Missing $envFile" }
if (-not $NodePath) { $NodePath = (Get-Command node.exe).Source }

$dbUrl = $null
foreach ($line in Get-Content -LiteralPath $envFile) {
  if ($line -match '^\s*DATABASE_URL\s*=\s*(.*)$') { $dbUrl = $Matches[1].Trim().Trim('"').Trim("'") }
}
if (-not $dbUrl) { throw "DATABASE_URL not found in $envFile" }

function Read-Secret([string]$Prompt) {
  $secure = Read-Host $Prompt -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
}
$password = Read-Secret "New password for $Email"
if ($password.Length -lt 8) { throw "Password must be at least 8 characters." }
if ($password -ne (Read-Secret "Repeat the new password")) { throw "Passwords do not match." }

$js = @'
const path = require("path");
const { PrismaClient } = require(path.join(process.env.CP_API_DIR, "node_modules", "@prisma", "client"));
const prisma = new PrismaClient();
(async () => {
  const email = process.env.CP_EMAIL;
  const password = process.env.CP_PASSWORD;
  try {
    await prisma.$executeRawUnsafe("CREATE EXTENSION IF NOT EXISTS pgcrypto");
  } catch (e) {
    console.error("Cannot enable the pgcrypto extension: " + e.message);
    console.error("Ask a PostgreSQL superuser to run: CREATE EXTENSION pgcrypto;  (in this database)");
    process.exitCode = 2;
    return;
  }
  const updated = await prisma.$executeRaw`UPDATE "users"
       SET "passwordHash" = crypt(${password}, gen_salt('bf', 10)),
           "updated_at" = now(),
           "userupdated_at" = 'reset-admin-password'
     WHERE lower("email") = lower(${email}) AND "isdelete" = false`;
  console.log("Updated: " + updated);
  if (updated === 0) {
    console.error("No active account with this email. Run the production seed first, or check the email.");
    process.exitCode = 3;
  }
})()
  .catch((e) => { console.error(e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
'@

$jsFile = Join-Path $env:TEMP ("cp-reset-" + [guid]::NewGuid().ToString("N") + ".cjs")
Set-Content -LiteralPath $jsFile -Value $js -Encoding ASCII
# Secrets go through environment variables of this process only, never the command line.
$env:CP_API_DIR = $apiDir; $env:CP_EMAIL = $Email; $env:CP_PASSWORD = $password; $env:DATABASE_URL = $dbUrl
try {
  & $NodePath $jsFile
  $code = $LASTEXITCODE
} finally {
  Remove-Item -LiteralPath $jsFile -Force -ErrorAction SilentlyContinue
  Remove-Item Env:\CP_API_DIR, Env:\CP_EMAIL, Env:\CP_PASSWORD, Env:\DATABASE_URL -ErrorAction SilentlyContinue
  Remove-Variable password -ErrorAction SilentlyContinue
}

if ($code -eq 0) {
  Write-Host "PASSWORD RESET OK for $Email. Check with test-login.ps1." -ForegroundColor Green
} else {
  Write-Host "PASSWORD RESET FAILED (exit code $code)" -ForegroundColor Red
  exit $code
}
