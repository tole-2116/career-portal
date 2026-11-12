# Diagnoses the HRISCareer site: IIS configuration, endpoints and the latest Node logs.
# Run in an elevated (Administrator) PowerShell. Changes nothing.
#   powershell -ExecutionPolicy Bypass -File .\check-site.ps1

[CmdletBinding()]
param(
  # Default: the folder that contains this tools folder (e.g. D:\HRIS\DQC\Source\HRISCareer).
  [string]$InstallDir = "",
  [string]$SiteName = "HRISCareer",
  [int]$Port = 8080,
  [int]$InternalPort = 8090,
  [int]$LogLines = 20
)

# $PSScriptRoot is empty inside param defaults of advanced scripts on PowerShell 5.1.
if (-not $InstallDir) { $InstallDir = Split-Path -Parent $PSScriptRoot }

Import-Module WebAdministration
function Section([string]$Title) { Write-Host ""; Write-Host "===== $Title =====" -ForegroundColor Cyan }

Section "IIS services"
Get-Service W3SVC, WAS | Format-Table Name, Status -AutoSize

Section "Site"
if (-not (Test-Path "IIS:\Sites\$SiteName")) {
  Write-Host "Site '$SiteName' does not exist. Run setup-iis-site.ps1." -ForegroundColor Red
} else {
  Get-Website $SiteName | Format-Table Name, State, PhysicalPath -AutoSize
  Section "Bindings (need *:$Port and 127.0.0.1:$InternalPort)"
  Get-WebBinding -Name $SiteName | Format-Table protocol, bindingInformation -AutoSize
  Section "Applications (need /api, plus /WebApi if aliases are used)"
  Get-WebApplication -Site $SiteName | Format-Table path, applicationPool, PhysicalPath -AutoSize
  Section "Virtual directories (need /uploads)"
  Get-WebVirtualDirectory -Site $SiteName | Format-Table path, PhysicalPath -AutoSize
}

Section "Application pools"
Get-ChildItem IIS:\AppPools | Where-Object { $_.Name -like "$SiteName-*" } | Format-Table Name, State, startMode -AutoSize

Section "Files"
foreach ($f in "web\server\index.mjs", "web\web.config", "api\dist\index.js", "api\web.config", "data\api.env", "data\uploads\web.config") {
  $path = Join-Path $InstallDir $f
  $state = if (Test-Path -LiteralPath $path) { "OK" } else { "MISSING" }
  Write-Host ("{0,-8} {1}" -f $state, $path)
}
foreach ($cfg in "web\web.config", "api\web.config") {
  $path = Join-Path $InstallDir $cfg
  if (Test-Path -LiteralPath $path) {
    [xml]$x = Get-Content -LiteralPath $path -Raw
    $n = $x.SelectSingleNode("//aspNetCore")
    Write-Host ""
    Write-Host "$cfg"
    Write-Host "  processPath   = $($n.processPath)"
    Write-Host "  stdoutLogFile = $($n.stdoutLogFile)"
    foreach ($e in $n.SelectNodes("environmentVariables/environmentVariable")) { Write-Host "  $($e.name) = $($e.value)" }
  }
}
$envFile = Join-Path $InstallDir "data\api.env"
if (Test-Path -LiteralPath $envFile) {
  Write-Host ""
  Write-Host "api.env keys (values hidden):"
  Get-Content -LiteralPath $envFile | ForEach-Object { if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=') { "  " + $Matches[1] } }
  Write-Host "api.env permissions:"
  & icacls $envFile
}

Section "Endpoints"
foreach ($u in "http://127.0.0.1:$InternalPort/", "http://127.0.0.1:$InternalPort/api/site-config", "http://127.0.0.1:$InternalPort/api/form-config", "http://127.0.0.1:$Port/") {
  try {
    $r = Invoke-WebRequest $u -UseBasicParsing -TimeoutSec 60
    Write-Host "$u -> $($r.StatusCode)" -ForegroundColor Green
  } catch {
    $resp = $_.Exception.Response
    if ($resp) {
      $body = (New-Object IO.StreamReader($resp.GetResponseStream())).ReadToEnd()
      $kind = if ($body -match '^\s*\{') { "JSON from API" } elseif ($body -match '<!DOCTYPE html') { "HTML (web or IIS page)" } else { "other" }
      Write-Host "$u -> $([int]$resp.StatusCode) [$kind] $($body.Substring(0, [Math]::Min(150, $body.Length)))" -ForegroundColor Red
    } else {
      Write-Host "$u -> NO RESPONSE: $($_.Exception.Message)" -ForegroundColor Red
    }
  }
}

foreach ($app in "api", "web") {
  Section "Latest $app log (last $LogLines lines)"
  $log = Get-ChildItem (Join-Path $InstallDir "data\logs\$app\node_*.log") -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if ($log) { Write-Host $log.FullName; Get-Content -LiteralPath $log.FullName -Tail $LogLines }
  else { Write-Host "No log file yet (Node never started, or the pool cannot write to data\logs\$app)." -ForegroundColor Yellow }
}
