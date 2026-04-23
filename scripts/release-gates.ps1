param(
  [string]$BaseUrl = "http://localhost:3000/api",
  [switch]$SkipSmoke,
  [switch]$EnableAuthMonitor,
  [int]$MonitorWindowMinutes = 5,
  [int]$MonitorIntervalSeconds = 15,
  [string]$ReportPath
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Add-Result {
  param(
    [System.Collections.Generic.List[object]]$Target,
    [string]$Name,
    [bool]$Mandatory,
    [bool]$Passed,
    [string]$Details
  )
  $Target.Add([pscustomobject]@{
      Name = $Name
      Mandatory = $Mandatory
      Passed = $Passed
      Details = $Details
    })
}

function Invoke-Step {
  param(
    [string]$Name,
    [string]$WorkingDirectory,
    [bool]$Mandatory,
    [scriptblock]$Action,
    [System.Collections.Generic.List[object]]$Results
  )

  Write-Host "==> $Name" -ForegroundColor Cyan
  Push-Location $WorkingDirectory
  try {
    & $Action
    if ($LASTEXITCODE -ne 0) {
      throw "ExitCode=$LASTEXITCODE"
    }
    Add-Result -Target $Results -Name $Name -Mandatory $Mandatory -Passed $true -Details "OK"
    Write-Host "OK: $Name" -ForegroundColor Green
  } catch {
    Add-Result -Target $Results -Name $Name -Mandatory $Mandatory -Passed $false -Details $_.Exception.Message
    Write-Host "FALHOU: $Name - $($_.Exception.Message)" -ForegroundColor Red
  } finally {
    Pop-Location
  }
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..")
$backendDir = Join-Path $repoRoot "apps/backend"
$mobileDir = Join-Path $repoRoot "apps/mobile"
$logsDir = Join-Path $repoRoot "logs"

if (-not (Test-Path $logsDir)) {
  New-Item -ItemType Directory -Path $logsDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
if (-not $ReportPath) {
  $ReportPath = Join-Path $logsDir "release-gates-$timestamp.md"
}

$results = New-Object System.Collections.Generic.List[object]

Invoke-Step -Name "Mobile validate:critical" -WorkingDirectory $mobileDir -Mandatory $true -Results $results -Action {
  npm run validate:critical
}

Invoke-Step -Name "Backend build" -WorkingDirectory $backendDir -Mandatory $true -Results $results -Action {
  npm run -s build
}

Invoke-Step -Name "Backend laudo spec" -WorkingDirectory $backendDir -Mandatory $true -Results $results -Action {
  npm run test -- modules/laudos/laudos.service.spec.ts
}

Invoke-Step -Name "Backend CRM RBAC spec" -WorkingDirectory $backendDir -Mandatory $true -Results $results -Action {
  npm run test -- modules/crm/crm.service.spec.ts
}

Invoke-Step -Name "Backend CRM controller sensitive spec" -WorkingDirectory $backendDir -Mandatory $true -Results $results -Action {
  npm run test -- modules/crm/crm.controller.spec.ts
}

Invoke-Step -Name "Backend governance protocol+consent spec" -WorkingDirectory $backendDir -Mandatory $true -Results $results -Action {
  npm run test -- modules/clinical-governance/clinical-governance.service.spec.ts
}

if (-not $SkipSmoke) {
  Invoke-Step -Name "Backend smoke health ($BaseUrl/health)" -WorkingDirectory $backendDir -Mandatory $true -Results $results -Action {
    powershell -ExecutionPolicy Bypass -File scripts/smoke-health.ps1 -BaseUrl $BaseUrl
  }

  Invoke-Step -Name "Clinical 5xx monitor (public)" -WorkingDirectory $repoRoot -Mandatory $true -Results $results -Action {
    powershell -ExecutionPolicy Bypass -File scripts/monitor-clinical-5xx.ps1 -BaseUrl $BaseUrl -WindowMinutes $MonitorWindowMinutes -IntervalSeconds $MonitorIntervalSeconds
  }

  $envIdentifier = if ($null -ne $env:MONITOR_IDENTIFIER) { "$env:MONITOR_IDENTIFIER".Trim() } else { "" }
  $envPassword = if ($null -ne $env:MONITOR_PASSWORD) { "$env:MONITOR_PASSWORD".Trim() } else { "" }
  $hasEnvCredentials = [bool]($envIdentifier -and $envPassword)

  if ($EnableAuthMonitor -and -not $hasEnvCredentials) {
    Add-Result -Target $results -Name "Clinical 5xx monitor (authenticated)" -Mandatory $true -Passed $false -Details "EnableAuthMonitor set but MONITOR_IDENTIFIER/MONITOR_PASSWORD are missing."
  } elseif ($EnableAuthMonitor -or $hasEnvCredentials) {
    Invoke-Step -Name "Clinical 5xx monitor (authenticated)" -WorkingDirectory $repoRoot -Mandatory $true -Results $results -Action {
      powershell -ExecutionPolicy Bypass -File scripts/monitor-clinical-5xx.ps1 -BaseUrl $BaseUrl -UseEnvCredentials -WindowMinutes $MonitorWindowMinutes -IntervalSeconds $MonitorIntervalSeconds
    }
  } else {
    Add-Result -Target $results -Name "Clinical 5xx monitor (authenticated)" -Mandatory $false -Passed $true -Details "SKIPPED (no credentials in env)"
  }
} else {
  Add-Result -Target $results -Name "Backend smoke health ($BaseUrl/health)" -Mandatory $true -Passed $true -Details "SKIPPED (explicit)"
  Add-Result -Target $results -Name "Clinical 5xx monitor (public)" -Mandatory $true -Passed $true -Details "SKIPPED (explicit)"
  Add-Result -Target $results -Name "Clinical 5xx monitor (authenticated)" -Mandatory $false -Passed $true -Details "SKIPPED (explicit)"
}

$mandatoryFailures = @($results | Where-Object { $_.Mandatory -and -not $_.Passed })
$status = if ($mandatoryFailures.Count -eq 0) { "GO" } else { "NO-GO" }

$reportLines = @()
$reportLines += "# Release Gates Report"
$reportLines += ""
$reportLines += "- GeneratedAt: $(Get-Date -Format o)"
$reportLines += "- BaseUrl: $BaseUrl"
$reportLines += "- Status: **$status**"
$reportLines += ""
$reportLines += "| Step | Mandatory | Result | Details |"
$reportLines += "|---|---|---|---|"
foreach ($item in $results) {
  $mandatory = if ($item.Mandatory) { "Yes" } else { "No" }
  $result = if ($item.Passed) { "PASS" } else { "FAIL" }
  $details = [string]$item.Details
  $details = $details.Replace("|", "/")
  $reportLines += "| $($item.Name) | $mandatory | $result | $details |"
}

if ($mandatoryFailures.Count -gt 0) {
  $reportLines += ""
  $reportLines += "## Mandatory failures"
  foreach ($failure in $mandatoryFailures) {
    $reportLines += "- $($failure.Name): $($failure.Details)"
  }
}

Set-Content -Path $ReportPath -Value ($reportLines -join [Environment]::NewLine) -Encoding UTF8

Write-Host ""
Write-Host "Report: $ReportPath" -ForegroundColor Yellow
Write-Host "Release decision: $status" -ForegroundColor Yellow

if ($status -eq "NO-GO") {
  exit 1
}

exit 0
