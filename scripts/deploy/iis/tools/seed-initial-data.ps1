# Seeds a NEW HRISCareer database directly on the server (no source code, no bun):
#   - default site configuration and application form (from seed-data.json next to this script)
#   - the first admin account (password asked, hashed with bcrypt inside PostgreSQL / pgcrypto)
# Existing rows are never overwritten, so running it again is harmless.
# Uses node.exe and the Prisma client in <InstallDir>\api and DATABASE_URL from <InstallDir>\data\api.env.
# Run in an elevated (Administrator) PowerShell AFTER setup-iis-site.ps1 -Migrate.
#
#   powershell -ExecutionPolicy Bypass -File .\seed-initial-data.ps1

[CmdletBinding()]
param(
  # Default: the folder that contains this tools folder (e.g. D:\HRIS\DQC\Source\HRISCareer).
  [string]$InstallDir = "",
  [string]$AdminEmail = "admin@careerportal.com",
  [string]$AdminName = "",
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
$dataFile = Join-Path $PSScriptRoot "seed-data.json"
foreach ($f in (Join-Path $apiDir "node_modules\@prisma\client\package.json"), $envFile, $dataFile) {
  if (-not (Test-Path -LiteralPath $f)) { throw "Missing $f" }
}
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
$js = @'
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require(path.join(process.env.CP_API_DIR, "node_modules", "@prisma", "client"));
const prisma = new PrismaClient();
const audit = { usercreate_at: "seed-initial-data", userupdated_at: "seed-initial-data", isdelete: false };

(async () => {
  if (process.env.CP_CHECK_ONLY === "1") {
    const found = await prisma.user.findFirst({ where: { email: process.env.CP_EMAIL.trim().toLowerCase() } });
    console.log(found ? "ADMIN_EXISTS" : "ADMIN_MISSING");
    return;
  }
  const data = JSON.parse(fs.readFileSync(process.env.CP_DATA_FILE, "utf8"));

  for (const row of data.site_configs) {
    const exists = await prisma.site_configs.findFirst({ where: { code: row.code } });
    if (exists) { console.log("SiteConfig '" + row.code + "' already exists, kept."); continue; }
    await prisma.site_configs.create({ data: { ...row, ...audit } });
    console.log("SiteConfig '" + row.code + "' created.");
  }

  for (const row of data.form_configs) {
    const exists = await prisma.form_configs.findFirst({ where: { code: row.code } });
    if (exists) { console.log("FormConfig '" + row.code + "' already exists, kept."); continue; }
    await prisma.form_configs.create({ data: { ...row, ...audit } });
    console.log("FormConfig '" + row.code + "' created.");
  }

  const email = process.env.CP_EMAIL.trim().toLowerCase();
  const admin = await prisma.user.findFirst({ where: { email } });
  if (admin) {
    console.log("Admin " + email + " already exists, password NOT changed (use reset-admin-password.ps1).");
  } else {
    await prisma.$executeRawUnsafe("CREATE EXTENSION IF NOT EXISTS pgcrypto");
    await prisma.$executeRaw`INSERT INTO "users"
        ("id", "code", "email", "passwordHash", "name", "role", "created_at", "updated_at", "usercreate_at", "userupdated_at", "isdelete")
      VALUES (gen_random_uuid()::text, 'USR-ROOT-001', ${email}, crypt(${process.env.CP_PASSWORD}, gen_salt('bf', 10)),
        ${process.env.CP_NAME || data.admin_name || "Admin"}, 'ADMIN'::"Role", now(), now(), 'seed-initial-data', 'seed-initial-data', false)`;
    console.log("Admin " + email + " created.");
  }
})()
  .catch((e) => { console.error("SEED ERROR: " + e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
'@

$jsFile = Join-Path $env:TEMP ("cp-seed-" + [guid]::NewGuid().ToString("N") + ".cjs")
Set-Content -LiteralPath $jsFile -Value $js -Encoding ASCII
# Secrets go through this process's environment only, never the command line.
$env:CP_API_DIR = $apiDir; $env:CP_DATA_FILE = $dataFile; $env:CP_EMAIL = $AdminEmail
$env:CP_NAME = $AdminName; $env:DATABASE_URL = $dbUrl
try {
  # Ask for the admin password only when the account does not exist yet.
  $env:CP_CHECK_ONLY = "1"
  $state = (& $NodePath $jsFile | Out-String).Trim()
  if ($LASTEXITCODE -ne 0 -or $state -notmatch "ADMIN_(EXISTS|MISSING)") { throw "Cannot read the database (run migrations first): $state" }
  Remove-Item Env:\CP_CHECK_ONLY
  if ($state -match "ADMIN_MISSING") {
    $password = Read-Secret "Password for the first admin $AdminEmail (min 8 chars)"
    if ($password.Length -lt 8) { throw "Password must be at least 8 characters." }
    if ($password -ne (Read-Secret "Repeat the password")) { throw "Passwords do not match." }
    $env:CP_PASSWORD = $password
  }
  & $NodePath $jsFile
  $code = $LASTEXITCODE
} finally {
  Remove-Item -LiteralPath $jsFile -Force -ErrorAction SilentlyContinue
  Remove-Item Env:\CP_API_DIR, Env:\CP_DATA_FILE, Env:\CP_EMAIL, Env:\CP_NAME, Env:\CP_PASSWORD, Env:\CP_CHECK_ONLY, Env:\DATABASE_URL -ErrorAction SilentlyContinue
  Remove-Variable password -ErrorAction SilentlyContinue
}

if ($code -eq 0) {
  Write-Host "SEED OK. Check with: .\setup-iis-site.ps1 then .\test-login.ps1" -ForegroundColor Green
} else {
  Write-Host "SEED FAILED (exit code $code)" -ForegroundColor Red
  exit $code
}
