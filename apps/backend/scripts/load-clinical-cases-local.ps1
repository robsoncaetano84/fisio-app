param(
  [int]$Port = 3020,
  [string]$HostName = "127.0.0.1",
  [int]$Cases = 100,
  [int]$Professionals = 20,
  [int]$Concurrency = 10,
  [string]$RunId = "",
  [int]$StartupTimeoutSeconds = 60,
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Test-TcpPortOpen {
  param(
    [string]$HostName,
    [int]$Port
  )

  $client = New-Object System.Net.Sockets.TcpClient
  try {
    $async = $client.BeginConnect($HostName, $Port, $null, $null)
    $connected = $async.AsyncWaitHandle.WaitOne(500)
    if (-not $connected) { return $false }
    $client.EndConnect($async)
    return $true
  } catch {
    return $false
  } finally {
    $client.Close()
  }
}

function Get-LogTail {
  param([string]$Path)
  if (-not (Test-Path $Path)) { return "" }
  return (Get-Content -Path $Path -Tail 80 -ErrorAction SilentlyContinue) -join [Environment]::NewLine
}

function Wait-BackendHealth {
  param(
    [string]$BaseUrl,
    [System.Diagnostics.Process]$Process,
    [int]$TimeoutSeconds,
    [string]$StdoutLog,
    [string]$StderrLog
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  $lastError = ""

  while ((Get-Date) -lt $deadline) {
    if ($Process.HasExited) {
      $stdoutTail = Get-LogTail -Path $StdoutLog
      $stderrTail = Get-LogTail -Path $StderrLog
      throw "Backend encerrou antes do healthcheck. ExitCode=$($Process.ExitCode)`nSTDOUT:`n$stdoutTail`nSTDERR:`n$stderrTail"
    }

    try {
      $health = Invoke-RestMethod -Method Get -Uri "$BaseUrl/health/ready" -TimeoutSec 3
      if ($health -and $health.status -eq "ok") {
        return
      }
      $lastError = "Health retornou status '$($health.status)'"
    } catch {
      $lastError = $_.Exception.Message
    }

    Start-Sleep -Seconds 2
  }

  $stdoutTail = Get-LogTail -Path $StdoutLog
  $stderrTail = Get-LogTail -Path $StderrLog
  throw "Backend nao ficou saudavel em ${TimeoutSeconds}s. Ultimo erro: $lastError`nSTDOUT:`n$stdoutTail`nSTDERR:`n$stderrTail"
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = (Resolve-Path (Join-Path $scriptDir "..")).Path
$logsDir = Join-Path $backendDir "logs"
if (-not (Test-Path $logsDir)) {
  New-Item -ItemType Directory -Path $logsDir | Out-Null
}

$baseUrl = "http://${HostName}:$Port/api"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$stdoutLog = Join-Path $logsDir "load-clinical-cases-backend-$timestamp.out.log"
$stderrLog = Join-Path $logsDir "load-clinical-cases-backend-$timestamp.err.log"
$backendProcess = $null
$previousPort = $env:PORT
$previousNodeEnv = $env:NODE_ENV
$previousTrustProxy = $env:TRUST_PROXY

try {
  if (Test-TcpPortOpen -HostName $HostName -Port $Port) {
    throw "Porta $Port ja esta em uso em $HostName. Informe outra porta com -Port."
  }

  Push-Location $backendDir
  try {
    if (-not $SkipBuild) {
      Write-Host "Build backend..."
      npm run -s build
      if ($LASTEXITCODE -ne 0) {
        throw "Build falhou com ExitCode=$LASTEXITCODE"
      }
    }

    $env:PORT = [string]$Port
    $env:NODE_ENV = "development"
    $env:TRUST_PROXY = "true"

    Write-Host "Subindo backend em $baseUrl ..."
    $backendProcess = Start-Process `
      -FilePath "node" `
      -ArgumentList @("dist/main") `
      -WorkingDirectory $backendDir `
      -RedirectStandardOutput $stdoutLog `
      -RedirectStandardError $stderrLog `
      -WindowStyle Hidden `
      -PassThru

    Wait-BackendHealth `
      -BaseUrl $baseUrl `
      -Process $backendProcess `
      -TimeoutSeconds $StartupTimeoutSeconds `
      -StdoutLog $stdoutLog `
      -StderrLog $stderrLog

    Write-Host "Health OK. Rodando carga clinica..."
    $loadArgs = @(
      "scripts/load-test-clinical-cases.mjs",
      "--base-url=$baseUrl",
      "--cases=$Cases",
      "--professionals=$Professionals",
      "--concurrency=$Concurrency"
    )
    if (-not [string]::IsNullOrWhiteSpace($RunId)) {
      $loadArgs += "--run-id=$RunId"
    }

    node @loadArgs
    if ($LASTEXITCODE -ne 0) {
      throw "load-test-clinical-cases falhou com ExitCode=$LASTEXITCODE"
    }
  } finally {
    Pop-Location
  }

  Write-Host "OK: carga clinica local concluida em $baseUrl"
} finally {
  if ($null -ne $backendProcess -and -not $backendProcess.HasExited) {
    Write-Host "Encerrando backend PID=$($backendProcess.Id) ..."
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    $backendProcess.WaitForExit(5000) | Out-Null
  }

  $env:PORT = $previousPort
  $env:NODE_ENV = $previousNodeEnv
  $env:TRUST_PROXY = $previousTrustProxy

  Write-Host "Logs:"
  Write-Host "  $stdoutLog"
  Write-Host "  $stderrLog"
}
