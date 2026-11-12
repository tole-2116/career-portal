# Creates <InstallDir>\data\api.env (API secrets) for HRISCareer.
# Run in an elevated (Administrator) PowerShell, once per server.
#
# Simplest: only the PostgreSQL password is asked (hidden input); the connection string is
# built and URL-encoded automatically from -DbHost/-DbPort/-DbName/-DbUser:
#
#   powershell -ExecutionPolicy Bypass -File .\create-api-env.ps1 -ClientUrl "http://localhost:8080"
#
# Or pass a ready connection string (password already URL-encoded), in single quotes:
#
#   ... -DatabaseUrl 'postgresql://hriscareer:p%40ss@localhost:5433/hriscareer?schema=public'
#
# Refuses to overwrite an existing file unless -Force is given (a new JWT_SECRET logs everyone out).

[CmdletBinding()]
param(
  # Default: the folder that contains this tools folder (e.g. D:\HRIS\DQC\Source\HRISCareer).
  [string]$InstallDir = "",
  [Parameter(Mandatory = $true)][string]$ClientUrl,
  [string]$DbHost = "localhost",
  [int]$DbPort = 5433,
  [string]$DbName = "hriscareer",
  [string]$DbUser = "hriscareer",
  [string]$DatabaseUrl = "",
  [switch]$Force
)

# $PSScriptRoot is empty inside param defaults of advanced scripts on PowerShell 5.1.
if (-not $InstallDir) { $InstallDir = Split-Path -Parent $PSScriptRoot }

$ErrorActionPreference = "Stop"

$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw "Please run this script from PowerShell opened with 'Run as Administrator'."
}

$dataDir = Join-Path $InstallDir "data"
$envFile = Join-Path $dataDir "api.env"
if ((Test-Path -LiteralPath $envFile) -and -not $Force) {
  throw "$envFile already exists. Use -Force to replace it (this also generates a new JWT_SECRET)."
}

function Read-Secret([string]$Prompt) {
  $secure = Read-Host $Prompt -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
}

if (-not $DatabaseUrl) {
  Write-Host "Database: $DbUser@${DbHost}:$DbPort/$DbName  (change with -DbHost -DbPort -DbName -DbUser)"
  $entered = (Read-Secret "Password of PostgreSQL user '$DbUser' (as typed in psql, not encoded)").Trim()
  if (-not $entered) { throw "Password is required." }
  if ($entered -match '^postgres(ql)?://') {
    # A full connection string was pasted instead of the password: use it as is.
    $DatabaseUrl = $entered
  } else {
    $encodedUser = [Uri]::EscapeDataString($DbUser)
    $encodedPassword = [Uri]::EscapeDataString($entered)
    $DatabaseUrl = "postgresql://${encodedUser}:$encodedPassword@${DbHost}:$DbPort/$([Uri]::EscapeDataString($DbName))?schema=public"
  }
  Remove-Variable entered
}
$DatabaseUrl = $DatabaseUrl.Trim().Trim('"').Trim("'")
if ($DatabaseUrl -notmatch '^postgres(ql)?://') {
  throw ("-DatabaseUrl must be a full connection string starting with postgresql:// " +
    "(received $($DatabaseUrl.Length) characters). Or omit -DatabaseUrl and type only the password.")
}
if ($DatabaseUrl -like "*<*") { throw "DATABASE_URL still contains a <placeholder>." }

# Show where it points, never the password.
$shown = $DatabaseUrl -replace '^(postgres(ql)?://[^:/@]+):[^@]*@', '$1:***@'
Write-Host "DATABASE_URL = $shown"

$bytes = New-Object byte[] 48
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)

New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
@(
  "DATABASE_URL=`"$DatabaseUrl`"",
  "CLIENT_URL=`"$ClientUrl`"",
  ("JWT_SECRET=`"" + [Convert]::ToBase64String($bytes) + "`""),
  'JWT_ISSUER="career-portal-api"',
  'JWT_ACCESS_TTL="15m"',
  'JWT_REFRESH_TTL_DAYS="7"'
) | Set-Content -LiteralPath $envFile -Encoding ASCII

# Only Administrators and SYSTEM until setup-iis-site.ps1 grants read access to the API pool.
& icacls $envFile /inheritance:r /grant:r "*S-1-5-32-544:F" "*S-1-5-18:F" /Q | Out-Null
if ($LASTEXITCODE -ne 0) { throw "icacls failed on $envFile" }

Write-Host "Created $envFile" -ForegroundColor Green
Write-Host "Keys: DATABASE_URL, CLIENT_URL=$ClientUrl, JWT_SECRET (generated), JWT_ISSUER, JWT_ACCESS_TTL, JWT_REFRESH_TTL_DAYS"
