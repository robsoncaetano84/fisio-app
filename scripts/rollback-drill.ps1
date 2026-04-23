param(
  [string]$TargetCommit = "HEAD~1",
  [string]$ReportPath
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..")
$logsDir = Join-Path $repoRoot "logs"
if (-not (Test-Path $logsDir)) {
  New-Item -ItemType Directory -Path $logsDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
if (-not $ReportPath) {
  $ReportPath = Join-Path $logsDir "rollback-drill-$timestamp.md"
}

Push-Location $repoRoot
try {
  git cat-file -e "$TargetCommit`^{commit}" 2>$null
  if ($LASTEXITCODE -ne 0) {
    throw "Target commit not found: $TargetCommit"
  }

  $currentCommit = (git rev-parse --short HEAD).Trim()
  $targetResolved = (git rev-parse --short $TargetCommit).Trim()
  $changedFiles = git diff --name-status "$TargetCommit..HEAD"

  $lines = @()
  $lines += "# Rollback Drill Report"
  $lines += ""
  $lines += "- GeneratedAt: $(Get-Date -Format o)"
  $lines += "- CurrentCommit: $currentCommit"
  $lines += "- TargetCommit: $TargetCommit ($targetResolved)"
  $lines += "- DrillMode: SIMULATION_ONLY"
  $lines += ""
  $lines += "## Planned rollback commands"
  $lines += '```bash'
  $lines += "git fetch --all --prune"
  $lines += "git checkout <release-branch>"
  $lines += "git reset --hard $targetResolved"
  $lines += "git push origin <release-branch> --force-with-lease"
  $lines += '```'
  $lines += ""
  $lines += "## Changed files between target and current"
  if ($changedFiles) {
    $lines += '```text'
    $lines += $changedFiles
    $lines += '```'
  }
  else {
    $lines += "- No changes detected between target and current commit."
  }
  $lines += ""
  $lines += "## Result"
  $lines += "- Status: PASS (simulation completed, no repository mutation performed)"

  Set-Content -Path $ReportPath -Value ($lines -join [Environment]::NewLine) -Encoding UTF8
  Write-Host "Rollback drill report generated: $ReportPath" -ForegroundColor Yellow
  exit 0
}
finally {
  Pop-Location
}
