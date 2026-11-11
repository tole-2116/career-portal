<#
.SYNOPSIS
  One-command deploy of this career-portal release to IIS.

.DESCRIPTION
  Run from the release folder (the folder containing web\, api\, setup-iis.ps1):

      .\deploy.ps1 -HostName "careers.example.com"

  Steps (re-launches itself elevated if needed; full log in <DataDir>\logs\deploy-*.log):
    1. Copy this release to <InstallRoot>\releases\<timestamp> (IIS never runs from the copy source).
    2. First run only: create <DataDir>\api.env (asks for DATABASE_URL / CLIENT_URL,
       generates JWT_SECRET). Later runs keep it, but -DatabaseUrl / -ClientUrl, when passed,
       overwrite those two values (JWT_SECRET and other keys are kept).
    3. Back up the database with pg_dump, when pg_dump is on PATH (-SkipBackup to skip).
    4. Apply Prisma migrations with `npx prisma migrate deploy` (-SkipMigrate to skip).
    5. Configure IIS and switch the site to the new release (setup-iis.ps1).
    6. Health check; on failure, switch IIS back to the previous release.
    7. Keep the newest -KeepReleases release folders, delete older ones.

  Rollback manually: run setup-iis.ps1 from an older folder under <InstallRoot>\releases.

  Fixed-folder mode (-TargetDir): IIS always points at one folder, e.g.

      .\deploy.ps1 -TargetDir "D:\Rec.Project\career-portal" -SiteName "career.portal.vn" -HostName "career.portal.vn"

  Puts app_offline.htm in web\ and api\ (stops Node, shows a maintenance page), mirrors the new
  web\ and api\ into the folder (keeping logs\), then reconfigures IIS. Data: <TargetDir>\data.
#>
[CmdletBinding()]
param(
  [string]$SiteName = "career-portal",
  [int]$Port = 80,
  [string]$HostName = "",
  [int]$InternalPort = 8089,
  # Everything lives on drive D by default:
  #   D:\sites\career-portal\releases\<timestamp>   site files (web\, api\)
  #   D:\sites\career-portal\data                   api.env, uploads, logs, backups
  [string]$InstallRoot = "D:\sites\career-portal",
  # Fixed-folder mode: deploy into one folder IIS always points at (e.g. D:\Rec.Project\career-portal)
  # instead of versioned releases. Data defaults to <TargetDir>\data. No automatic rollback.
  [string]$TargetDir = "",
  [string]$DataDir = "",
  [string]$NodePath = "",
  [int]$KeepReleases = 5,
  [string]$DatabaseUrl = "",
  # Internal: carries -DatabaseUrl into the elevated process without exposing it on the
  # command line (which the transcript records). The file is deleted after reading.
  [string]$DatabaseUrlFile = "",
  [string]$ClientUrl = "",
  [switch]$SkipBackup,
  [switch]$SkipMigrate,
  [string]$LogFile = ""
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

if ($TargetDir) { $TargetDir = [IO.Path]::GetFullPath($TargetDir).TrimEnd("\") }
$baseDir = if ($TargetDir) { $TargetDir } else { $InstallRoot }
$installDrive = Split-Path -Qualifier $baseDir
if (-not (Test-Path "$installDrive\")) {
  throw "Drive $installDrive does not exist on this server. Pass -InstallRoot or -TargetDir on another drive."
}
if (-not $DataDir) { $DataDir = Join-Path $baseDir "data" }

if (-not $LogFile) {
  $LogFile = Join-Path $DataDir ("logs\deploy-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".log")
}

# Checked before elevating so the error shows in the caller's window.
if ($DatabaseUrl -and $DatabaseUrl -like "*<*") {
  throw "-DatabaseUrl still contains a placeholder such as <password>. Pass the real connection string."
}

# --- Elevate -----------------------------------------------------------------------------
$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Write-Host "Requesting administrator rights (UAC)..."
  $argList = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "`"$PSCommandPath`"")
  foreach ($entry in $PSBoundParameters.GetEnumerator()) {
    if ($entry.Value -is [System.Management.Automation.SwitchParameter]) {
      if ($entry.Value.IsPresent) { $argList += "-$($entry.Key)" }
    } elseif ($entry.Key -notin @("LogFile", "DatabaseUrl", "DatabaseUrlFile")) {
      $argList += "-$($entry.Key)"; $argList += "`"$($entry.Value)`""
    }
  }
  if ($DatabaseUrl) {
    # %TEMP% is readable only by the current user (and the elevated copy of the same user).
    $secretFile = Join-Path $env:TEMP ("career-portal-db-" + [guid]::NewGuid().ToString("N") + ".txt")
    Set-Content -LiteralPath $secretFile -Value $DatabaseUrl -Encoding ASCII -NoNewline
    $argList += "-DatabaseUrlFile"; $argList += "`"$secretFile`""
  }
  $argList += "-LogFile"; $argList += "`"$LogFile`""
  try {
    $process = Start-Process powershell.exe -Verb RunAs -Wait -PassThru -ArgumentList $argList
  } finally {
    if ($DatabaseUrl) { Remove-Item -LiteralPath $secretFile -Force -ErrorAction SilentlyContinue }
  }
  if (Test-Path -LiteralPath $LogFile) { Get-Content -LiteralPath $LogFile }
  exit $process.ExitCode
}

function Write-Step([string]$Message) { Write-Host "==> $Message" -ForegroundColor Cyan }

if ($DatabaseUrlFile -and (Test-Path -LiteralPath $DatabaseUrlFile)) {
  if (-not $DatabaseUrl) { $DatabaseUrl = (Get-Content -LiteralPath $DatabaseUrlFile -Raw).Trim() }
  Remove-Item -LiteralPath $DatabaseUrlFile -Force
}

function Read-EnvFile([string]$Path) {
  $values = @{}
  foreach ($line in Get-Content -LiteralPath $Path) {
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
      $values[$Matches[1]] = $Matches[2].Trim().Trim('"').Trim("'")
    }
  }
  return $values
}

function Test-Endpoint([string]$Url) {
  for ($i = 0; $i -lt 10; $i++) {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 30
      if ($response.StatusCode -eq 200) { return $true }
    } catch { Start-Sleep -Seconds 3 }
  }
  return $false
}

function Set-EnvValues([string]$Path, [hashtable]$Updates) {
  $remaining = @{} + $Updates
  $lines = @(foreach ($line in Get-Content -LiteralPath $Path) {
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=' -and $remaining.ContainsKey($Matches[1])) {
      $key = $Matches[1]
      "$key=`"$($remaining[$key])`""
      $remaining.Remove($key)
    } else {
      $line
    }
  })
  foreach ($key in $remaining.Keys) { $lines += "$key=`"$($remaining[$key])`"" }
  # Overwrites the content in place, so the restricted ACL on the file is kept.
  $lines | Set-Content -LiteralPath $Path -Encoding ASCII
}

New-Item -ItemType Directory -Force -Path (Split-Path $LogFile) | Out-Null
$apiEnv = Join-Path $DataDir "api.env"

# api.env is created/updated before the transcript starts so secrets never reach the log.
if (Test-Path -LiteralPath $apiEnv) {
  $envUpdates = @{}
  if ($DatabaseUrl) { $envUpdates["DATABASE_URL"] = $DatabaseUrl }
  if ($ClientUrl) { $envUpdates["CLIENT_URL"] = $ClientUrl }
  if ($envUpdates.Count -gt 0) {
    Write-Step ("Updating " + (($envUpdates.Keys | Sort-Object) -join ", ") + " in $apiEnv")
    Set-EnvValues $apiEnv $envUpdates
  }
} else {
  Write-Step "First deploy: creating $apiEnv"
  if (-not $DatabaseUrl) {
    $secure = Read-Host "DATABASE_URL (postgresql://user:pass@host:5432/db?schema=public)" -AsSecureString
    $DatabaseUrl = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
      [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
  }
  if (-not $DatabaseUrl) { throw "DATABASE_URL is required." }
  if (-not $ClientUrl) {
    $defaultClientUrl = if ($HostName) { "https://$HostName" } else { "http://localhost:$Port" }
    $ClientUrl = Read-Host "CLIENT_URL [$defaultClientUrl]"
    if (-not $ClientUrl) { $ClientUrl = $defaultClientUrl }
  }
  $bytes = New-Object byte[] 48
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  New-Item -ItemType Directory -Force -Path $DataDir | Out-Null
  @(
    "DATABASE_URL=`"$DatabaseUrl`"",
    "CLIENT_URL=`"$ClientUrl`"",
    ("JWT_SECRET=`"" + [Convert]::ToBase64String($bytes) + "`""),
    'JWT_ISSUER="career-portal-api"',
    'JWT_ACCESS_TTL="15m"',
    'JWT_REFRESH_TTL_DAYS="7"'
  ) | Set-Content -LiteralPath $apiEnv -Encoding ASCII
  # Only Administrators and SYSTEM may read it until setup-iis.ps1 grants the API pool.
  & icacls $apiEnv /inheritance:r /grant:r "*S-1-5-32-544:F" "*S-1-5-18:F" /Q | Out-Null
}

Start-Transcript -Path $LogFile -Append | Out-Null
$exitCode = 0
try {
  $source = $PSScriptRoot
  foreach ($required in @("web\server\index.mjs", "api\dist\index.js", "setup-iis.ps1")) {
    if (-not (Test-Path -LiteralPath (Join-Path $source $required))) { throw "Release is incomplete: $required is missing in $source." }
  }

  # 1. Copy the release into its own versioned folder (fixed-folder mode copies later,
  #    right before IIS is reconfigured, to keep the site offline as briefly as possible).
  $releasesDir = Join-Path $InstallRoot "releases"
  if ($TargetDir) {
    $release = $TargetDir
    Write-Step "Fixed-folder deploy: $source -> $release"
  } elseif ((Split-Path $source -Parent) -eq $releasesDir) {
    $release = $source
    Write-Step "Using release in place: $release"
  } else {
    $release = Join-Path $releasesDir (Get-Date -Format "yyyyMMdd-HHmmss")
    Write-Step "Copying release to $release"
    New-Item -ItemType Directory -Force -Path $release | Out-Null
    & robocopy $source $release /E /NFL /NDL /NJH /NJS /NP | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "robocopy failed with exit code $LASTEXITCODE" }
  }

  $envValues = Read-EnvFile $apiEnv
  $dbUrl = $envValues["DATABASE_URL"]
  if (-not $dbUrl -or $dbUrl -like "*<*") {
    throw "DATABASE_URL in $apiEnv is not set (or still contains a <placeholder>). Re-run with -DatabaseUrl `"postgresql://...`" to overwrite it."
  }

  # 2. Backup.
  if (-not $SkipBackup) {
    $pgDump = Get-Command pg_dump.exe -ErrorAction SilentlyContinue
    if ($pgDump) {
      $backupDir = Join-Path $DataDir "backups"
      New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
      $backupFile = Join-Path $backupDir ("db-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".dump")
      Write-Step "Backing up database to $backupFile"
      # libpq does not understand Prisma's ?schema= parameter.
      $pgUrl = ($dbUrl -replace '([?&])schema=[^&]*&?', '$1') -replace '[?&]$', ''
      & $pgDump.Source --format=custom --file=$backupFile --dbname=$pgUrl
      if ($LASTEXITCODE -ne 0) { throw "pg_dump failed with exit code $LASTEXITCODE" }
    } else {
      Write-Warning "pg_dump not found on PATH: skipping database backup."
    }
  }

  # 3. Migrations, with the Prisma CLI version matching the bundled client.
  if (-not $SkipMigrate) {
    $prismaVersion = (Get-Content -Raw (Join-Path $source "api\node_modules\@prisma\client\package.json") | ConvertFrom-Json).version
    Write-Step "Applying database migrations (prisma $prismaVersion)"
    $env:DATABASE_URL = $dbUrl
    try {
      & npx.cmd --yes "prisma@$prismaVersion" migrate deploy --schema (Join-Path $source "api\prisma\schema.prisma")
      if ($LASTEXITCODE -ne 0) { throw "prisma migrate deploy failed with exit code $LASTEXITCODE" }
    } finally {
      Remove-Item Env:\DATABASE_URL -ErrorAction SilentlyContinue
    }
  }

  # 4. Remember the live release, then switch IIS to the new one.
  Import-Module WebAdministration
  $previous = $null
  if (-not $TargetDir -and (Test-Path "IIS:\Sites\$SiteName")) {
    $previous = Split-Path (Get-ItemProperty "IIS:\Sites\$SiteName").physicalPath -Parent
    if ($previous -eq $release) { $previous = $null }
  }

  if ($TargetDir -and $source -ne $TargetDir) {
    # app_offline.htm makes the ASP.NET Core Module stop Node (releasing file locks such as the
    # Prisma engine DLL) and serve a maintenance page while files are replaced.
    $offline = '<!doctype html><meta charset="utf-8"><title>Maintenance</title><p>The site is being updated. Please retry in a minute.</p>'
    $offlineFiles = @()
    foreach ($app in "web", "api") {
      $appDir = Join-Path $TargetDir $app
      if (Test-Path -LiteralPath $appDir) {
        $file = Join-Path $appDir "app_offline.htm"
        Set-Content -LiteralPath $file -Value $offline -Encoding UTF8
        $offlineFiles += $file
      }
    }
    if ($offlineFiles) { Write-Step "Site offline for update"; Start-Sleep -Seconds 5 }
    try {
      foreach ($app in "web", "api") {
        Write-Step "Copying $app"
        & robocopy (Join-Path $source $app) (Join-Path $TargetDir $app) /MIR /R:3 /W:2 /XD logs uploads /XF app_offline.htm .env /NFL /NDL /NJH /NJS /NP | Out-Null
        if ($LASTEXITCODE -ge 8) { throw "robocopy of $app failed with exit code $LASTEXITCODE" }
      }
      foreach ($file in "deploy.ps1", "setup-iis.ps1", "README.md") {
        Copy-Item -LiteralPath (Join-Path $source $file) -Destination $TargetDir -Force
      }
    } finally {
      $offlineFiles | ForEach-Object { Remove-Item -LiteralPath $_ -Force -ErrorAction SilentlyContinue }
    }
  }
  $setupArgs = @{ SiteName = $SiteName; Port = $Port; HostName = $HostName; InternalPort = $InternalPort; DataDir = $DataDir }
  if ($NodePath) { $setupArgs.NodePath = $NodePath }
  Write-Step "Configuring IIS"
  & (Join-Path $release "setup-iis.ps1") @setupArgs

  # 5. Health check with automatic rollback.
  Write-Step "Health check"
  $healthy = (Test-Endpoint "http://127.0.0.1:$InternalPort/") -and (Test-Endpoint "http://127.0.0.1:$InternalPort/api/site-config")
  if (-not $healthy) {
    if ($previous -and (Test-Path -LiteralPath (Join-Path $previous "setup-iis.ps1"))) {
      Write-Warning "New release is unhealthy; rolling IIS back to $previous (database migrations are not reverted)."
      & (Join-Path $previous "setup-iis.ps1") @setupArgs
    }
    throw "Health check failed. Node logs: $(Join-Path $DataDir 'logs')"
  }

  # 6. Prune old releases (never the live one or the one before it).
  if ((Split-Path $release -Parent) -eq $releasesDir) {
    $keep = @($release, $previous) | Where-Object { $_ }
    Get-ChildItem -LiteralPath $releasesDir -Directory | Sort-Object Name -Descending |
      Select-Object -Skip $KeepReleases | Where-Object { $keep -notcontains $_.FullName } |
      ForEach-Object {
        $oldRelease = $_
        try { Remove-Item -LiteralPath $oldRelease.FullName -Recurse -Force; Write-Host "    removed old release $($oldRelease.Name)" }
        catch { Write-Warning "Could not remove $($oldRelease.FullName): $($_.Exception.Message)" }
      }
  }

  Write-Host ""
  Write-Host "DEPLOY OK: $release is live on '$SiteName'." -ForegroundColor Green
} catch {
  $exitCode = 1
  Write-Host "DEPLOY FAILED: $($_.Exception.Message)" -ForegroundColor Red
} finally {
  Stop-Transcript | Out-Null
}
exit $exitCode
