param(
  [string]$BaseUrl = "http://localhost:3000/api",
  [string]$BearerToken = "",
  [string]$Identifier = "",
  [string]$Password = "",
  [switch]$UseEnvCredentials,
  [int]$WindowMinutes = 5,
  [int]$IntervalSeconds = 15,
  [string]$ReportPath
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

if ($WindowMinutes -lt 1) { $WindowMinutes = 1 }
if ($IntervalSeconds -lt 5) { $IntervalSeconds = 5 }

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..")
$logsDir = Join-Path $repoRoot "logs"
if (-not (Test-Path $logsDir)) {
  New-Item -ItemType Directory -Path $logsDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
if (-not $ReportPath) {
  $ReportPath = Join-Path $logsDir "monitor-clinical-5xx-$timestamp.md"
}

$envIdentifier = if ($null -ne $env:MONITOR_IDENTIFIER) { "$env:MONITOR_IDENTIFIER".Trim() } else { "" }
$envPassword = if ($null -ne $env:MONITOR_PASSWORD) { "$env:MONITOR_PASSWORD".Trim() } else { "" }
if (($UseEnvCredentials -or (-not $Identifier -and -not $Password)) -and $envIdentifier -and $envPassword) {
  if (-not $Identifier) { $Identifier = $envIdentifier }
  if (-not $Password) { $Password = $envPassword }
}

$authMode = "none"
if (-not $BearerToken -and $Identifier -and $Password) {
  $payload = @{ identificador = $Identifier; senha = $Password } | ConvertTo-Json -Compress
  try {
    $loginObj = Invoke-RestMethod -Method Post -Uri "$BaseUrl/auth/login" -ContentType "application/json" -Body $payload
    if ($loginObj.token) {
      $BearerToken = [string]$loginObj.token
      $authMode = "credentials"
    } else {
      throw "Login response without token."
    }
  } catch {
    throw "Failed to authenticate for monitor script: $($_.Exception.Message)"
  }
}

$headers = @{}
if ($BearerToken) {
  $headers["Authorization"] = "Bearer $BearerToken"
  if ($authMode -eq "none") {
    $authMode = "token"
  }
}

$endpoints = @(
  @{ Name = "health"; Url = "$BaseUrl/health"; Auth = $false },
  @{ Name = "auth.me"; Url = "$BaseUrl/auth/me"; Auth = $true },
  @{ Name = "pacientes.paged"; Url = "$BaseUrl/pacientes/paged?page=1&limit=5"; Auth = $true },
  @{ Name = "pacientes.attention"; Url = "$BaseUrl/pacientes/attention"; Auth = $true },
  @{ Name = "atividades.updates"; Url = "$BaseUrl/atividades/updates?limit=10"; Auth = $true },
  @{ Name = "metrics.summary"; Url = "$BaseUrl/metrics/clinical-flow/summary?windowDays=7"; Auth = $true }
)

$results = New-Object System.Collections.Generic.List[object]
$startedAt = Get-Date
$endedAt = $startedAt.AddMinutes($WindowMinutes)

while ((Get-Date) -lt $endedAt) {
  foreach ($ep in $endpoints) {
    if ($ep.Auth -and -not $BearerToken) {
      continue
    }

    $statusCode = $null
    $errorMessage = $null
    try {
      $curlArgs = @(
        "-sS",
        "-o", "NUL",
        "-w", "%{http_code}",
        "--max-time", "20"
      )

      if ($headers.Count -gt 0 -and $ep.Auth) {
        $curlArgs += @("-H", "Authorization: Bearer $BearerToken")
      }

      $curlArgs += $ep.Url
      $httpCodeRaw = & curl.exe @curlArgs
      $httpCodeText = "$httpCodeRaw".Trim()
      if ($httpCodeText -match "^\d{3}$") {
        $statusCode = [int]$httpCodeText
      } else {
        $statusCode = 0
        $errorMessage = "Invalid HTTP code from curl: $httpCodeText"
      }
    } catch {
      $statusCode = 0
      $errorMessage = ($_ | Out-String).Trim()
    }

    $results.Add([pscustomobject]@{
        Timestamp = (Get-Date).ToString("o")
        Endpoint = $ep.Name
        Url = $ep.Url
        StatusCode = $statusCode
        Is5xx = ($statusCode -ge 500 -and $statusCode -lt 600)
        IsTransportError = ($statusCode -eq 0)
        Error = $errorMessage
      })
  }

  Start-Sleep -Seconds $IntervalSeconds
}

$total = $results.Count
$total5xx = @($results | Where-Object { $_.Is5xx }).Count
$totalTransportErrors = @($results | Where-Object { $_.IsTransportError }).Count
$status = if ($total5xx -eq 0 -and $totalTransportErrors -eq 0) { "PASS" } else { "FAIL" }

$summaryByEndpoint = $results |
  Group-Object Endpoint |
  ForEach-Object {
    $items = $_.Group
    [pscustomobject]@{
      Endpoint = $_.Name
      Requests = $items.Count
      Errors5xx = @($items | Where-Object { $_.Is5xx }).Count
      MaxStatus = ($items | Measure-Object -Property StatusCode -Maximum).Maximum
    }
  }

$lines = @()
$lines += "# Monitoramento de 5xx - Endpoints Clinicos"
$lines += ""
$lines += "- GeneratedAt: $(Get-Date -Format o)"
$lines += "- BaseUrl: $BaseUrl"
$lines += "- WindowMinutes: $WindowMinutes"
$lines += "- IntervalSeconds: $IntervalSeconds"
$lines += "- AuthenticatedMode: $([bool]$BearerToken)"
$lines += "- AuthSource: $authMode"
$lines += "- Status: **$status**"
$lines += "- TotalRequests: $total"
$lines += "- Total5xx: $total5xx"
$lines += "- TotalTransportErrors: $totalTransportErrors"
$lines += ""
$lines += "| Endpoint | Requests | 5xx | MaxStatus |"
$lines += "|---|---:|---:|---:|"
foreach ($row in $summaryByEndpoint) {
  $lines += "| $($row.Endpoint) | $($row.Requests) | $($row.Errors5xx) | $($row.MaxStatus) |"
}

if ($total5xx -gt 0) {
  $lines += ""
  $lines += "## Ocorrencias 5xx"
  $lines += "| Timestamp | Endpoint | Status | Error |"
  $lines += "|---|---|---:|---|"
  foreach ($item in ($results | Where-Object { $_.Is5xx })) {
    $err = [string]$item.Error
    $err = $err.Replace("|", "/")
    $lines += "| $($item.Timestamp) | $($item.Endpoint) | $($item.StatusCode) | $err |"
  }
}

if ($totalTransportErrors -gt 0) {
  $lines += ""
  $lines += "## Erros de transporte"
  $lines += "| Timestamp | Endpoint | Error |"
  $lines += "|---|---|---|"
  foreach ($item in ($results | Where-Object { $_.IsTransportError })) {
    $err = [string]$item.Error
    $err = $err.Replace("|", "/")
    $lines += "| $($item.Timestamp) | $($item.Endpoint) | $err |"
  }
}

Set-Content -Path $ReportPath -Value ($lines -join [Environment]::NewLine) -Encoding UTF8
Write-Host "5xx monitor report: $ReportPath" -ForegroundColor Yellow

if ($status -eq "FAIL") {
  exit 1
}
exit 0
