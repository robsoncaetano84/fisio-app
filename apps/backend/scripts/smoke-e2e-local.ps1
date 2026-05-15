param(
  [int]$Port = 3010,
  [string]$HostName = "127.0.0.1",
  [string]$NodeEnv = "development",
  [int]$StartupTimeoutSeconds = 60,
  [switch]$SkipBuild,
  [switch]$SkipQuickTest,
  [string]$Email = "admin@teste.com",
  [string]$Senha = "Teste1234",
  [string]$NomePaciente = "Paciente Smoke",
  [string]$NomeUsuario = "Admin Smoke",
  [string]$RegistroProf = "CREFITO-000000",
  [string]$Especialidade = "Fisioterapia",
  [string]$Role = "USER",
  [string]$Cpf = ""
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
      $health = Invoke-RestMethod -Method Get -Uri "$BaseUrl/health" -TimeoutSec 3
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
$stdoutLog = Join-Path $logsDir "smoke-e2e-backend-$timestamp.out.log"
$stderrLog = Join-Path $logsDir "smoke-e2e-backend-$timestamp.err.log"
$backendProcess = $null
$previousPort = $env:PORT
$previousNodeEnv = $env:NODE_ENV

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
    $env:NODE_ENV = $NodeEnv

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

    Write-Host "Health OK."
    powershell -ExecutionPolicy Bypass -File scripts/smoke-health.ps1 -BaseUrl $baseUrl
    if ($LASTEXITCODE -ne 0) {
      throw "smoke-health falhou com ExitCode=$LASTEXITCODE"
    }

    if (-not $SkipQuickTest) {
      $quickTestArgs = @(
        "-ExecutionPolicy", "Bypass",
        "-File", "scripts/quick-test.ps1",
        "-BaseUrl", $baseUrl,
        "-Email", $Email,
        "-Senha", $Senha,
        "-NomePaciente", $NomePaciente,
        "-NomeUsuario", $NomeUsuario,
        "-RegistroProf", $RegistroProf,
        "-Especialidade", $Especialidade,
        "-Role", $Role
      )
      if (-not [string]::IsNullOrWhiteSpace($Cpf)) {
        $quickTestArgs += @("-Cpf", $Cpf)
      }

      powershell @quickTestArgs
      if ($LASTEXITCODE -ne 0) {
        throw "quick-test falhou com ExitCode=$LASTEXITCODE"
      }
    }
  } finally {
    Pop-Location
  }

  Write-Host "OK: smoke e2e local concluido em $baseUrl"
} finally {
  if ($null -ne $backendProcess -and -not $backendProcess.HasExited) {
    Write-Host "Encerrando backend smoke PID=$($backendProcess.Id) ..."
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    $backendProcess.WaitForExit(5000) | Out-Null
  }

  $env:PORT = $previousPort
  $env:NODE_ENV = $previousNodeEnv

  Write-Host "Logs:"
  Write-Host "  $stdoutLog"
  Write-Host "  $stderrLog"
}
