param(
  [string]$BaseUrl = "http://localhost:3000/api"
)

$ErrorActionPreference = "Stop"

function Invoke-Healthcheck {
  param(
    [string]$Name,
    [string]$Url,
    [bool]$RequireDb
  )

  Write-Host "Validando $Name em $Url ..."
  $health = Invoke-RestMethod -Method Get -Uri $Url

  if (-not $health) {
    throw "$Name nao retornou payload."
  }

  Write-Host ("status: {0}" -f $health.status)
  if ($health.checks -and $health.checks.db) {
    Write-Host ("db: {0}" -f $health.checks.db.status)
  }
  Write-Host ("timestamp: {0}" -f $health.timestamp)

  if ($health.status -ne "ok") {
    throw "$Name retornou status nao-ok."
  }

  if (
    $RequireDb -and
    (-not $health.checks -or -not $health.checks.db -or $health.checks.db.status -ne "up")
  ) {
    throw "$Name nao confirmou banco disponivel."
  }
}

Invoke-Healthcheck -Name "liveness" -Url "$BaseUrl/health/live" -RequireDb $false
Invoke-Healthcheck -Name "readiness" -Url "$BaseUrl/health/ready" -RequireDb $true

Write-Host "OK: healthcheck validado."
