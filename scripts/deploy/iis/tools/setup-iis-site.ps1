# Installs / updates the HRISCareer site on IIS (web + /api + /uploads).
# Run in an elevated (Administrator) PowerShell. Safe to run again.
#
# First install or update with a new release (copies web\ and api\, applies migrations):
#   powershell -ExecutionPolicy Bypass -File .\setup-iis-site.ps1 -ReleaseDir "D:\HRIS\GODEV\Release\career-portal" -Migrate
#
# Only (re)configure IIS for the files already in <InstallDir>:
#   powershell -ExecutionPolicy Bypass -File .\setup-iis-site.ps1
#
# Domain on port 80, API also published as http://godev.hris.vn/WebApi/... (default alias):
#   powershell -ExecutionPolicy Bypass -File .\setup-iis-site.ps1 -Port 80 -HostName "godev.hris.vn" -ClientUrl "http://godev.hris.vn"
#
# Layout:
#   <InstallDir>\web\            IIS site            (pool <SiteName>-web)
#   <InstallDir>\api\            IIS application /api (pool <SiteName>-api)
#   <InstallDir>\data\api.env    API secrets (create with create-api-env.ps1)
#   <InstallDir>\data\uploads\   IIS virtual directory /uploads
#   <InstallDir>\data\logs\      Node stdout logs (web, api)

[CmdletBinding()]
param(
  # Default: the folder that contains this tools folder (e.g. D:\HRIS\DQC\Source\HRISCareer).
  [string]$InstallDir = "",
  [string]$SiteName = "HRISCareer",
  [int]$Port = 8080,
  [string]$HostName = "",
  [int]$InternalPort = 8090,
  # "https" needs -CertThumbprint of a certificate in LocalMachineMy (binding uses SNI).
  [ValidateSet("http", "https")][string]$Protocol = "http",
  [string]$CertThumbprint = "",
  # Folder of an unpacked release (contains web\ and api\). Empty = keep current files.
  [string]$ReleaseDir = "",
  # Apply Prisma migrations (needs Internet for npx and access to the database).
  [switch]$Migrate,
  # Also rewrite CLIENT_URL in api.env.
  [string]$ClientUrl = "",
  # Extra public paths for the API, comma separated (e.g. "WebApi" -> http://host/WebApi/jobs
  # serves /api/jobs). Each becomes an IIS application on the api folder. "none" = only /api.
  [string]$ApiAliases = "WebApi",
  [string]$NodePath = "",
  # Skip the final HTTP checks (install.ps1 runs them after seeding the database).
  [switch]$SkipTests
)

# $PSScriptRoot is empty inside param defaults of advanced scripts on PowerShell 5.1.
if (-not $InstallDir) { $InstallDir = Split-Path -Parent $PSScriptRoot }

$ErrorActionPreference = "Stop"
Import-Module WebAdministration

function Step([string]$Message) { Write-Host "==> $Message" -ForegroundColor Cyan }

$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw "Please run this script from PowerShell opened with 'Run as Administrator'."
}

$InstallDir = [IO.Path]::GetFullPath($InstallDir).TrimEnd("\")
$WebDir = Join-Path $InstallDir "web"
$ApiDir = Join-Path $InstallDir "api"
$Data = Join-Path $InstallDir "data"
$ApiEnv = Join-Path $Data "api.env"
$WebPool = "$SiteName-web"
$ApiPool = "$SiteName-api"
if ($Protocol -eq "https" -and -not $CertThumbprint) { throw "-Protocol https needs -CertThumbprint (certificate in Cert:\LocalMachine\My)." }
$CertThumbprint = ($CertThumbprint -replace '[^0-9A-Fa-f]', '').ToUpperInvariant()
if ($CertThumbprint -and -not (Test-Path "Cert:\LocalMachine\My\$CertThumbprint")) { throw "Certificate $CertThumbprint not found in Cert:\LocalMachine\My." }
$Aliases = @($ApiAliases -split "," | ForEach-Object { $_.Trim().Trim("/") } | Where-Object { $_ -and $_ -ne "api" -and $_ -ne "none" })

# ---- 1. Prerequisites ----
Step "1. Checking prerequisites"
if (-not (Get-WebGlobalModule -Name AspNetCoreModuleV2 -ErrorAction SilentlyContinue)) {
  throw "ASP.NET Core Module V2 is missing. Install the 'ASP.NET Core Hosting Bundle', run iisreset, then re-run."
}
if (-not $NodePath) {
  $nodeCmd = Get-Command node.exe -ErrorAction SilentlyContinue
  if (-not $nodeCmd) { throw "node.exe not found on PATH. Install Node.js 20+ for all users or pass -NodePath." }
  $NodePath = $nodeCmd.Source
}
$nodeVersion = (& $NodePath --version).TrimStart("v")
if ([int]($nodeVersion.Split(".")[0]) -lt 20) { throw "Node.js 20+ required, found $nodeVersion" }
Write-Host "    Node $nodeVersion at $NodePath"
if (-not (Test-Path -LiteralPath $ApiEnv)) { throw "Missing $ApiEnv. Create it first with create-api-env.ps1." }

# ---- 2. Copy release (optional) ----
if ($ReleaseDir) {
  $ReleaseDir = [IO.Path]::GetFullPath($ReleaseDir).TrimEnd("\")
  Step "2. Copying release $ReleaseDir -> $InstallDir"
  foreach ($required in "web\server\index.mjs", "api\dist\index.js", "api\prisma\schema.prisma") {
    if (-not (Test-Path -LiteralPath (Join-Path $ReleaseDir $required))) { throw "Release is incomplete: $required missing in $ReleaseDir" }
  }
  # app_offline.htm stops Node (releases file locks) and shows a maintenance page during the copy.
  $offline = '<!doctype html><meta charset="utf-8"><title>Maintenance</title><p>The site is being updated. Please retry in a minute.</p>'
  $offlineFiles = @()
  foreach ($dir in $WebDir, $ApiDir) {
    if (Test-Path -LiteralPath $dir) {
      $file = Join-Path $dir "app_offline.htm"
      Set-Content -LiteralPath $file -Value $offline -Encoding UTF8
      $offlineFiles += $file
    }
  }
  if ($offlineFiles) { Write-Host "    site offline for update"; Start-Sleep -Seconds 5 }
  try {
    foreach ($name in "web", "api") {
      & robocopy (Join-Path $ReleaseDir $name) (Join-Path $InstallDir $name) /MIR /R:3 /W:2 /XD logs /XF app_offline.htm .env /NFL /NDL /NJH /NJS /NP | Out-Null
      if ($LASTEXITCODE -ge 8) { throw "robocopy of $name failed with exit code $LASTEXITCODE" }
      Write-Host "    copied $name"
    }
  } finally {
    $offlineFiles | ForEach-Object { Remove-Item -LiteralPath $_ -Force -ErrorAction SilentlyContinue }
  }
} else {
  Step "2. No -ReleaseDir: keeping files already in $InstallDir"
}
foreach ($required in (Join-Path $WebDir "server\index.mjs"), (Join-Path $ApiDir "dist\index.js")) {
  if (-not (Test-Path -LiteralPath $required)) { throw "Missing $required. Pass -ReleaseDir with an unpacked release." }
}

# ---- 3. Data folders + api.env ----
Step "3. Preparing $Data"
New-Item -ItemType Directory -Force (Join-Path $Data "uploads"), (Join-Path $Data "logs\web"), (Join-Path $Data "logs\api") | Out-Null
if ($ClientUrl) {
  $lines = Get-Content -LiteralPath $ApiEnv | Where-Object { $_ -notmatch '^\s*CLIENT_URL\s*=' }
  @($lines) + "CLIENT_URL=`"$ClientUrl`"" | Set-Content -LiteralPath $ApiEnv -Encoding ASCII
  Write-Host "    CLIENT_URL=$ClientUrl"
}
$envValues = @{}
foreach ($line in Get-Content -LiteralPath $ApiEnv) {
  if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') { $envValues[$Matches[1]] = $Matches[2].Trim().Trim('"') }
}
foreach ($key in "DATABASE_URL", "CLIENT_URL", "JWT_SECRET") {
  if (-not $envValues[$key]) { throw "$key is missing in $ApiEnv" }
}

# ---- 4. Database migrations (optional) ----
if ($Migrate) {
  $prismaVersion = (Get-Content -Raw (Join-Path $ApiDir "node_modules\@prisma\client\package.json") | ConvertFrom-Json).version
  Step "4. Applying database migrations (prisma $prismaVersion)"
  $env:DATABASE_URL = $envValues["DATABASE_URL"]
  try {
    & npx.cmd --yes "prisma@$prismaVersion" migrate deploy --schema (Join-Path $ApiDir "prisma\schema.prisma")
    if ($LASTEXITCODE -ne 0) { throw "prisma migrate deploy failed with exit code $LASTEXITCODE" }
  } finally {
    Remove-Item Env:\DATABASE_URL -ErrorAction SilentlyContinue
  }
} else {
  Step "4. Skipping migrations (pass -Migrate to apply them)"
}

# ---- 5. web.config files ----
Step "5. Writing web.config files"
function Set-Ancm([string]$File, [string]$Log, [hashtable]$Vars) {
  [xml]$x = Get-Content -LiteralPath $File -Raw
  $n = $x.SelectSingleNode("//aspNetCore")
  $n.SetAttribute("processPath", $NodePath)
  $n.SetAttribute("stdoutLogFile", $Log)
  $n.SetAttribute("stdoutLogEnabled", "true")
  $ev = $n.SelectSingleNode("environmentVariables")
  foreach ($k in $Vars.Keys) {
    $e = $ev.SelectSingleNode("environmentVariable[@name='$k']")
    if (-not $e) { $e = $x.CreateElement("environmentVariable"); $e.SetAttribute("name", $k); [void]$ev.AppendChild($e) }
    $e.SetAttribute("value", [string]$Vars[$k])
  }
  $x.Save($File)
  Write-Host "    OK: $File"
}
Set-Ancm (Join-Path $WebDir "web.config") (Join-Path $Data "logs\web\node") @{
  NODE_ENV = "production"; API_INTERNAL_URL = "http://127.0.0.1:$InternalPort"
}
Set-Ancm (Join-Path $ApiDir "web.config") (Join-Path $Data "logs\api\node") @{
  NODE_ENV = "production"; DOTENV_CONFIG_PATH = $ApiEnv; UPLOAD_DIR = (Join-Path $Data "uploads")
  API_PATH_ALIASES = (($Aliases | ForEach-Object { "/$_" }) -join ",")
}
if ($Aliases -and -not (Select-String -LiteralPath (Join-Path $ApiDir "iis-launch.cjs") -Pattern "API_PATH_ALIASES" -Quiet)) {
  throw "api\iis-launch.cjs does not support API_PATH_ALIASES (old release). Use a newer build or copy the new iis-launch.cjs into $ApiDir."
}

# uploads: static files only, nothing executes, long cache.
@'
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <clear />
      <add name="StaticFile" path="*" verb="GET,HEAD" modules="StaticFileModule" resourceType="File" requireAccess="Read" />
    </handlers>
    <directoryBrowse enabled="false" />
    <staticContent>
      <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="7.00:00:00" />
      <remove fileExtension=".webp" />
      <mimeMap fileExtension=".webp" mimeType="image/webp" />
    </staticContent>
    <httpProtocol>
      <customHeaders>
        <remove name="X-Powered-By" />
        <add name="X-Content-Type-Options" value="nosniff" />
      </customHeaders>
    </httpProtocol>
  </system.webServer>
</configuration>
'@ | Set-Content -LiteralPath (Join-Path $Data "uploads\web.config") -Encoding UTF8

# ---- 6. Application pools ----
Step "6. Configuring application pools $WebPool, $ApiPool"
foreach ($p in $WebPool, $ApiPool) {
  if (-not (Test-Path "IIS:\AppPools\$p")) { New-WebAppPool $p | Out-Null; Write-Host "    created $p" }
  Set-ItemProperty "IIS:\AppPools\$p" managedRuntimeVersion ""                       # No Managed Code
  Set-ItemProperty "IIS:\AppPools\$p" startMode AlwaysRunning                        # start Node with IIS
  Set-ItemProperty "IIS:\AppPools\$p" processModel.idleTimeout ([TimeSpan]::Zero)     # never idle out
  Set-ItemProperty "IIS:\AppPools\$p" recycling.periodicRestart.time ([TimeSpan]::Zero)
}

# ---- 7. Site + bindings ----
Step "7. Configuring site $SiteName"
if (-not (Test-Path "IIS:\Sites\$SiteName")) {
  # Created on the internal binding; the public binding is added below (http or https).
  New-Website -Name $SiteName -PhysicalPath $WebDir -ApplicationPool $WebPool -IPAddress "127.0.0.1" -Port $InternalPort | Out-Null
} else {
  Set-ItemProperty "IIS:\Sites\$SiteName" physicalPath $WebDir
  Set-ItemProperty "IIS:\Sites\$SiteName" applicationPool $WebPool
}
$bindings = @((Get-WebBinding -Name $SiteName).bindingInformation)
if (-not (Get-WebBinding -Name $SiteName -Protocol $Protocol -Port $Port -HostHeader $HostName | Where-Object { $_.bindingInformation -eq "*:${Port}:$HostName" })) {
  if ($Protocol -eq "https") {
    New-WebBinding -Name $SiteName -Protocol https -IPAddress "*" -Port $Port -HostHeader $HostName -SslFlags $(if ($HostName) { 1 } else { 0 })
  } else {
    New-WebBinding -Name $SiteName -Protocol http -IPAddress "*" -Port $Port -HostHeader $HostName
  }
  Write-Host "    added $Protocol binding *:${Port}:$HostName"
}
if ($Protocol -eq "https") {
  $sslBinding = Get-WebBinding -Name $SiteName -Protocol https -Port $Port -HostHeader $HostName | Where-Object { $_.bindingInformation -eq "*:${Port}:$HostName" }
  # Re-binding the same certificate fails, so drop the old one first (ignored when none).
  try { $sslBinding.RemoveSslCertificate() } catch { }
  $sslBinding.AddSslCertificate($CertThumbprint, "My")
  Write-Host "    certificate $CertThumbprint bound to https *:${Port}:$HostName"
}
if ($bindings -notcontains "127.0.0.1:${InternalPort}:") { New-WebBinding -Name $SiteName -Protocol http -IPAddress "127.0.0.1" -Port $InternalPort }
Set-ItemProperty "IIS:\Sites\$SiteName" applicationDefaults.preloadEnabled $true

# ---- 8. Applications /api (+ aliases such as /WebApi) ----
$apiApps = @("api") + $Aliases
Step ("8. Configuring application(s) " + (($apiApps | ForEach-Object { "/$_" }) -join ", "))
$wanted = @($apiApps | ForEach-Object { "/$_".ToLowerInvariant() })
Get-WebApplication -Site $SiteName | Where-Object { $wanted -notcontains $_.path.ToLowerInvariant() } | ForEach-Object {
  Remove-WebApplication -Site $SiteName -Name $_.path.TrimStart("/")
  Write-Host "    removed unexpected application $($_.path)"
}
foreach ($appName in $apiApps) {
  if (-not (Get-WebApplication -Site $SiteName -Name $appName)) {
    New-WebApplication -Site $SiteName -Name $appName -PhysicalPath $ApiDir -ApplicationPool $ApiPool | Out-Null
    Write-Host "    created /$appName -> $ApiDir"
  } else {
    Set-ItemProperty "IIS:\Sites\$SiteName\$appName" physicalPath $ApiDir
    Set-ItemProperty "IIS:\Sites\$SiteName\$appName" applicationPool $ApiPool
  }
  Set-ItemProperty "IIS:\Sites\$SiteName\$appName" preloadEnabled $true
}

# ---- 9. Virtual directory /uploads ----
Step "9. Configuring virtual directory /uploads"
$uploadsDir = Join-Path $Data "uploads"
if (-not (Get-WebVirtualDirectory -Site $SiteName -Name "uploads")) {
  New-WebVirtualDirectory -Site $SiteName -Name "uploads" -PhysicalPath $uploadsDir | Out-Null
} else {
  Set-ItemProperty "IIS:\Sites\$SiteName\uploads" physicalPath $uploadsDir
}

# ---- 10. Permissions ----
Step "10. Granting folder permissions"
$w = "IIS AppPool\$WebPool"; $a = "IIS AppPool\$ApiPool"
function Grant([string]$Path, [string[]]$Arguments) {
  & icacls $Path @Arguments /Q | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "icacls failed on $Path" }
  Write-Host "    OK: $Path"
}
Grant $InstallDir @("/grant", "${w}:(OI)(CI)RX", "${a}:(OI)(CI)RX")
Grant $uploadsDir @("/grant", "${a}:(OI)(CI)M", "${w}:(OI)(CI)RX", "IUSR:(OI)(CI)RX")
Grant (Join-Path $Data "logs\web") @("/grant", "${w}:(OI)(CI)M")
Grant (Join-Path $Data "logs\api") @("/grant", "${a}:(OI)(CI)M")
Grant $ApiEnv @("/inheritance:r", "/grant:r", "*S-1-5-32-544:F", "*S-1-5-18:F", "${a}:R")

# ---- 11. Restart ----
Step "11. Restarting $SiteName"
foreach ($p in $WebPool, $ApiPool) {
  if ((Get-WebAppPoolState $p).Value -eq "Started") { Restart-WebAppPool $p } else { Start-WebAppPool $p }
}
if ((Get-WebsiteState $SiteName).Value -ne "Started") { Start-Website $SiteName }

# ---- 12. Smoke test ----
if ($SkipTests) { Write-Host "==> 12. Tests skipped" -ForegroundColor Cyan; return }
Step "12. Testing"
$failed = $false
$testUrls = @("http://127.0.0.1:$InternalPort/", "http://127.0.0.1:$InternalPort/api/site-config", "http://127.0.0.1:$InternalPort/api/form-config")
$testUrls += @($Aliases | ForEach-Object { "http://127.0.0.1:$InternalPort/$_/site-config" })
foreach ($u in $testUrls) {
  $ok = $false
  for ($i = 0; $i -lt 10 -and -not $ok; $i++) {
    try { $r = Invoke-WebRequest $u -UseBasicParsing -TimeoutSec 60; $ok = $true; Write-Host "    $u -> $($r.StatusCode)" -ForegroundColor Green }
    catch { Start-Sleep -Seconds 3 }
  }
  if (-not $ok) { $failed = $true; Write-Host "    $u -> FAIL (logs: $Data\logs)" -ForegroundColor Red }
}
$publicHost = if ($HostName) { $HostName } else { "localhost" }
$defaultPort = if ($Protocol -eq "https") { 443 } else { 80 }
$publicUrl = if ($Port -eq $defaultPort) { "${Protocol}://$publicHost" } else { "${Protocol}://${publicHost}:$Port" }
foreach ($alias in $Aliases) { Write-Host "    API also at $publicUrl/$alias/..." }
if ($failed) { Write-Host "SETUP FINISHED WITH ERRORS. Run check-site.ps1 for details." -ForegroundColor Red; exit 1 }
Write-Host "SETUP OK. Open $publicUrl/admin" -ForegroundColor Green
