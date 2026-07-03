[CmdletBinding()]
param(
  [Parameter(Position = 0)]
  [ValidateSet("start", "stop", "status", "logs", "reset")]
  [string]$Action = "start",

  [switch]$Force
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$composeFile = Join-Path $repoRoot "compose.yaml"
$envFile = Join-Path $repoRoot ".env"
$envExample = Join-Path $repoRoot ".env.example"

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker is not available on PATH. Install or start Docker Desktop."
}

if (-not (Test-Path -LiteralPath $envFile)) {
  Copy-Item -LiteralPath $envExample -Destination $envFile
  Write-Host "Created .env from .env.example. Values are for local development only."
}

function Invoke-Compose {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)

  & docker compose --file $composeFile --env-file $envFile @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "docker compose failed with exit code $LASTEXITCODE"
  }
}

switch ($Action) {
  "start" {
  Invoke-Compose up --detach --wait
  Invoke-Compose run --rm object-storage-init
  Invoke-Compose ps
  }
  "stop" {
    Invoke-Compose down --remove-orphans
  }
  "status" {
    Invoke-Compose ps
  }
  "logs" {
    Invoke-Compose logs --follow
  }
  "reset" {
    if (-not $Force) {
      $confirmation = Read-Host "Delete all local Project_MT database and object-storage data? Type RESET"
      if ($confirmation -ne "RESET") {
        Write-Host "Reset cancelled."
        exit 0
      }
    }

    Invoke-Compose down --volumes --remove-orphans
    Write-Host "Local Project_MT service data was deleted."
  }
}

