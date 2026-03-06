param(
  [string]$BaseUrl = "http://localhost:3000/api"
)

$ErrorActionPreference = "Stop"

Write-Host "Validando healthcheck em $BaseUrl/health ..."
$health = Invoke-RestMethod -Method Get -Uri "$BaseUrl/health"

if (-not $health) {
  throw "Healthcheck não retornou payload."
}

Write-Host ("status: {0}" -f $health.status)
if ($health.checks -and $health.checks.db) {
  Write-Host ("db: {0}" -f $health.checks.db.status)
}
Write-Host ("timestamp: {0}" -f $health.timestamp)

if ($health.status -ne "ok") {
  throw "Healthcheck retornou status não-ok."
}

Write-Host "OK: healthcheck validado."
