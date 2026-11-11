<#
.SYNOPSIS
  Configures IIS to run this career-portal release (web + /api) and points the site at it.

.DESCRIPTION
  Run as Administrator from the release folder (the folder containing web\ and api\).
  Idempotent: re-run it for every new release. Deploy each release into a NEW folder
  (e.g. C:\sites\career-portal\releases\2026-11-10) and run this script from there; IIS is
  switched to the new folder and the old one stays untouched for instant rollback.

  Layout created in IIS:
    Site  <SiteName>            -> web\     (pool <SiteName>-web, Node SSR via ASP.NET Core Module)
    App   <SiteName>/api        -> api\     (pool <SiteName>-api, Express API)
    VDir  <SiteName>/uploads    -> <DataDir>\uploads (served directly by IIS as static files)

  Persistent data (survives releases) lives in <DataDir>:
    api.env   API secrets (DATABASE_URL, JWT_SECRET, ...), created from api\.env.example
    uploads\  CVs and news images
    logs\     Node stdout logs for web and api

  Requirements: IIS with Static Content, the ASP.NET Core Module V2 (install the
  "ASP.NET Core Hosting Bundle"), Node.js 20+ installed for all users.
#>
[CmdletBinding()]
param(
  [string]$SiteName = "career-portal",
  [int]$Port = 80,
  [string]$HostName = "",
  # Loopback-only binding the SSR server uses to call the API through IIS.
  [int]$InternalPort = 8089,
  # Default: <InstallRoot>\data when run from <InstallRoot>\releases\<x>, else <this folder>\data.
  [string]$DataDir = "",
  [string]$NodePath = ""
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Write-Step([string]$Message) { Write-Host "==> $Message" -ForegroundColor Cyan }

$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw "Run this script from an elevated (Administrator) PowerShell."
}

Import-Module WebAdministration

$Root = $PSScriptRoot
if (-not $DataDir) {
  $releasesDir = Split-Path $Root -Parent
  $DataDir = if ((Split-Path $releasesDir -Leaf) -eq "releases") {
    Join-Path (Split-Path $releasesDir -Parent) "data"
  } else {
    Join-Path $Root "data"
  }
}
if (-not (Test-Path ((Split-Path -Qualifier $DataDir) + "\"))) {
  throw "Drive for DataDir '$DataDir' does not exist. Pass -DataDir explicitly."
}
$WebDir = Join-Path $Root "web"
$ApiDir = Join-Path $Root "api"
foreach ($required in @((Join-Path $WebDir "server\index.mjs"), (Join-Path $ApiDir "dist\index.js"))) {
  if (-not (Test-Path -LiteralPath $required)) { throw "Release is incomplete: $required is missing." }
}

Write-Step "Checking prerequisites"
if (-not (Get-WebGlobalModule -Name "AspNetCoreModuleV2" -ErrorAction SilentlyContinue)) {
  throw "ASP.NET Core Module V2 is not installed. Install the 'ASP.NET Core Hosting Bundle' and re-run."
}
if (-not $NodePath) {
  $nodeCmd = Get-Command node.exe -ErrorAction SilentlyContinue
  if (-not $nodeCmd) { throw "node.exe not found on PATH. Install Node.js 20+ or pass -NodePath." }
  $NodePath = $nodeCmd.Source
}
if (-not (Test-Path -LiteralPath $NodePath)) { throw "Node not found at $NodePath" }
$nodeVersion = (& $NodePath --version).TrimStart("v")
if ([int]($nodeVersion.Split(".")[0]) -lt 20) { throw "Node.js 20+ required, found $nodeVersion" }
Write-Host "    Node $nodeVersion at $NodePath"

$WebPool = "$SiteName-web"
$ApiPool = "$SiteName-api"
$UploadsDir = Join-Path $DataDir "uploads"
$LogsDir = Join-Path $DataDir "logs"
$ApiEnv = Join-Path $DataDir "api.env"

Write-Step "Preparing data folder $DataDir"
foreach ($dir in @($DataDir, $UploadsDir, (Join-Path $LogsDir "web"), (Join-Path $LogsDir "api"))) {
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
}
$envCreated = $false
if (-not (Test-Path -LiteralPath $ApiEnv)) {
  Copy-Item -LiteralPath (Join-Path $ApiDir ".env.example") -Destination $ApiEnv
  $envCreated = $true
}

# Uploaded files are served by IIS's static file handler only: nothing in this folder can
# execute, responses are never MIME-sniffed, and unique file names allow long caching.
# (.config files are already blocked by IIS's default request filtering.)
$uploadsConfig = @'
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
'@
Set-Content -LiteralPath (Join-Path $UploadsDir "web.config") -Value $uploadsConfig -Encoding UTF8

function Update-AncmConfig([string]$ConfigPath, [string]$LogFile, [hashtable]$Variables) {
  [xml]$xml = Get-Content -LiteralPath $ConfigPath -Raw
  $ancm = $xml.SelectSingleNode("/configuration/location/system.webServer/aspNetCore")
  $ancm.SetAttribute("processPath", $NodePath)
  $ancm.SetAttribute("stdoutLogFile", $LogFile)
  $vars = $ancm.SelectSingleNode("environmentVariables")
  foreach ($name in $Variables.Keys) {
    $node = $vars.SelectSingleNode("environmentVariable[@name='$name']")
    if (-not $node) {
      $node = $xml.CreateElement("environmentVariable")
      $node.SetAttribute("name", $name)
      [void]$vars.AppendChild($node)
    }
    $node.SetAttribute("value", [string]$Variables[$name])
  }
  $xml.Save($ConfigPath)
}

Write-Step "Writing web.config files"
Update-AncmConfig (Join-Path $WebDir "web.config") (Join-Path $LogsDir "web\node") @{
  API_INTERNAL_URL = "http://127.0.0.1:$InternalPort"
}
Update-AncmConfig (Join-Path $ApiDir "web.config") (Join-Path $LogsDir "api\node") @{
  DOTENV_CONFIG_PATH = $ApiEnv
  UPLOAD_DIR         = $UploadsDir
}

function Set-AppPool([string]$Name) {
  $path = "IIS:\AppPools\$Name"
  if (-not (Test-Path $path)) { New-WebAppPool -Name $Name | Out-Null }
  Set-ItemProperty $path -Name managedRuntimeVersion -Value ""          # No Managed Code
  Set-ItemProperty $path -Name startMode -Value "AlwaysRunning"         # start Node with IIS
  Set-ItemProperty $path -Name processModel.idleTimeout -Value ([TimeSpan]::Zero)
  Set-ItemProperty $path -Name recycling.periodicRestart.time -Value ([TimeSpan]::Zero)
}

Write-Step "Configuring application pools"
Set-AppPool $WebPool
Set-AppPool $ApiPool

Write-Step "Configuring site $SiteName"
$sitePath = "IIS:\Sites\$SiteName"
if (-not (Test-Path $sitePath)) {
  New-Website -Name $SiteName -PhysicalPath $WebDir -ApplicationPool $WebPool -Port $Port -HostHeader $HostName | Out-Null
} else {
  Set-ItemProperty $sitePath -Name physicalPath -Value $WebDir
  Set-ItemProperty $sitePath -Name applicationPool -Value $WebPool
}
$publicBinding = "*:${Port}:$HostName"
if (-not (Get-WebBinding -Name $SiteName | Where-Object { $_.protocol -eq "http" -and $_.bindingInformation -eq $publicBinding })) {
  New-WebBinding -Name $SiteName -Protocol http -IPAddress "*" -Port $Port -HostHeader $HostName
}
$internalBinding = "127.0.0.1:${InternalPort}:"
if (-not (Get-WebBinding -Name $SiteName | Where-Object { $_.bindingInformation -eq $internalBinding })) {
  New-WebBinding -Name $SiteName -Protocol http -IPAddress "127.0.0.1" -Port $InternalPort
}
Set-ItemProperty $sitePath -Name applicationDefaults.preloadEnabled -Value $true

$apiAppPath = "IIS:\Sites\$SiteName\api"
if (-not (Get-WebApplication -Site $SiteName -Name "api")) {
  New-WebApplication -Site $SiteName -Name "api" -PhysicalPath $ApiDir -ApplicationPool $ApiPool | Out-Null
} else {
  Set-ItemProperty $apiAppPath -Name physicalPath -Value $ApiDir
  Set-ItemProperty $apiAppPath -Name applicationPool -Value $ApiPool
}
Set-ItemProperty $apiAppPath -Name preloadEnabled -Value $true

if (-not (Get-WebVirtualDirectory -Site $SiteName -Name "uploads")) {
  New-WebVirtualDirectory -Site $SiteName -Name "uploads" -PhysicalPath $UploadsDir | Out-Null
} else {
  Set-ItemProperty "IIS:\Sites\$SiteName\uploads" -Name physicalPath -Value $UploadsDir
}

Write-Step "Granting file permissions"
$webIdentity = "IIS AppPool\$WebPool"
$apiIdentity = "IIS AppPool\$ApiPool"
function Grant-Access([string]$Path, [string[]]$Grants) {
  & icacls $Path /grant $Grants /Q | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "icacls failed on $Path (exit code $LASTEXITCODE)" }
}
Grant-Access $Root @("${webIdentity}:(OI)(CI)RX", "${apiIdentity}:(OI)(CI)RX")
# The web pool's worker reads uploads\web.config (the vdir belongs to the root app);
# IUSR reads the files for anonymous requests; only the API can write.
Grant-Access $UploadsDir @("${apiIdentity}:(OI)(CI)M", "${webIdentity}:(OI)(CI)RX", "IUSR:(OI)(CI)RX")
Grant-Access (Join-Path $LogsDir "web") @("${webIdentity}:(OI)(CI)M")
Grant-Access (Join-Path $LogsDir "api") @("${apiIdentity}:(OI)(CI)M")
Grant-Access $ApiEnv @("${apiIdentity}:R")

if ($envCreated) {
  Write-Warning "Created $ApiEnv from the template. Fill in DATABASE_URL, CLIENT_URL and JWT_SECRET, then re-run this script."
}

Write-Step "Restarting $SiteName"
foreach ($pool in @($WebPool, $ApiPool)) {
  if ((Get-WebAppPoolState -Name $pool).Value -eq "Started") { Restart-WebAppPool -Name $pool } else { Start-WebAppPool -Name $pool }
}
if ((Get-WebsiteState -Name $SiteName).Value -ne "Started") { Start-Website -Name $SiteName }

Write-Step "Smoke test"
foreach ($url in @("http://127.0.0.1:$InternalPort/", "http://127.0.0.1:$InternalPort/api/site-config")) {
  try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 90
    Write-Host "    $($response.StatusCode) $url" -ForegroundColor Green
  } catch {
    Write-Warning "    FAILED $url : $($_.Exception.Message). See logs in $LogsDir."
  }
}

Write-Host ""
Write-Host "Release $Root is live on site '$SiteName'." -ForegroundColor Green
Write-Host "setup-iis.ps1 does not run database migrations (deploy.ps1 does; see README.md)."
