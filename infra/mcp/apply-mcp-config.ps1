# Applies persistent MCP configuration for Antigravity IDE and Grok Build.
# Migrates hardcoded secrets from existing configs into Windows User env vars (one-time).
# Usage: .\infra\mcp\apply-mcp-config.ps1 [-UseBridges]
param(
    [switch]$UseBridges = $true
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$templatePath = Join-Path $PSScriptRoot "mcp_config.template.json"
$backupDir = Join-Path $repoRoot ".backup\mcp"
$antigravityConfigs = @(
    (Join-Path $env:USERPROFILE ".gemini\antigravity-ide\mcp_config.json"),
    (Join-Path $env:USERPROFILE ".gemini\config\mcp_config.json"),
    (Join-Path $env:USERPROFILE ".gemini\antigravity\mcp_config.json")
)

function Ensure-UserEnvVar([string]$Name, [string]$Value) {
    if (-not $Value) { return }
    $existing = [Environment]::GetEnvironmentVariable($Name, "User")
    if (-not $existing) {
        [Environment]::SetEnvironmentVariable($Name, $Value, "User")
        Write-Host "[migrate] Set user env var: $Name"
    }
}

function Migrate-SecretsFromConfig([string]$ConfigPath) {
    if (-not (Test-Path $ConfigPath)) { return }
    try {
        $cfg = Get-Content $ConfigPath -Raw | ConvertFrom-Json
        if ($cfg.mcpServers."github-mcp-server".env.GITHUB_PERSONAL_ACCESS_TOKEN) {
            Ensure-UserEnvVar "GITHUB_PERSONAL_ACCESS_TOKEN" $cfg.mcpServers."github-mcp-server".env.GITHUB_PERSONAL_ACCESS_TOKEN
        }
        if ($cfg.mcpServers.xai.env.XAI_API_KEY) {
            Ensure-UserEnvVar "XAI_API_KEY" $cfg.mcpServers.xai.env.XAI_API_KEY
        }
        if ($cfg.mcpServers.supabase.serverUrl -match "project_ref=([^&]+)") {
            Ensure-UserEnvVar "SUPABASE_PROJECT_REF" $Matches[1]
        }
    } catch {
        Write-Warning "Could not migrate secrets from $ConfigPath : $_"
    }
}

function Get-DockerExe {
    $default = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"
    if (Test-Path $default) { return $default }
    $cmd = Get-Command docker -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    return $default
}

function Get-PythonExe {
    $uv = Get-Command uv -ErrorAction SilentlyContinue
    if ($uv) { return $uv.Source }
    $cmd = Get-Command python -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    return "python"
}

function Get-GrokBuildArgs([string]$ScriptPath) {
    $uv = Get-Command uv -ErrorAction SilentlyContinue
    if ($uv) { return @("run", $ScriptPath) }
    return @($ScriptPath)
}

function Get-EnhancedPath {
    $grokBin = Join-Path $env:USERPROFILE ".grok\bin"
    $dockerBin = "C:\Program Files\Docker\Docker\resources\bin"
    $uvBin = Join-Path $env:USERPROFILE ".local\bin"
    $parts = @($grokBin, $dockerBin, $uvBin) + ($env:PATH -split ';')
    ($parts | Where-Object { $_ -and (Test-Path $_ -ErrorAction SilentlyContinue) } | Select-Object -Unique) -join ';'
}

# One-time secret migration from existing configs
foreach ($cfg in $antigravityConfigs) { Migrate-SecretsFromConfig $cfg }

# Require tokens from user env (PAT preferred for Supabase persistence)
$githubToken = [Environment]::GetEnvironmentVariable("GITHUB_PERSONAL_ACCESS_TOKEN", "User")
$supabaseRef = [Environment]::GetEnvironmentVariable("SUPABASE_PROJECT_REF", "User")
$supabaseToken = [Environment]::GetEnvironmentVariable("SUPABASE_ACCESS_TOKEN", "User")

$missing = @()
if (-not $githubToken) { $missing += "GITHUB_PERSONAL_ACCESS_TOKEN" }
if (-not $supabaseRef) { $missing += "SUPABASE_PROJECT_REF" }
if (-not $supabaseToken) { $missing += "SUPABASE_ACCESS_TOKEN" }

if ($missing.Count -gt 0) {
    Write-Host ""
    Write-Host "Missing user environment variables:" -ForegroundColor Yellow
    $missing | ForEach-Object { Write-Host "  - $_" }
    Write-Host ""
    Write-Host "Set them in Windows Settings > System > About > Advanced system settings > Environment Variables (User)."
    Write-Host "See .env.example MCP section for placeholder names. Do NOT commit real values."
    Write-Host ""
}

$dockerExe = Get-DockerExe
$pythonExe = Get-PythonExe
$grokScript = Join-Path $env:USERPROFILE ".grok-mcp\grok_delegate_mcp.py"
$enhancedPath = Get-EnhancedPath

if ($UseBridges) {
    $bridgesDir = Join-Path $PSScriptRoot "bridges"
    $pwsh = (Get-Command pwsh -ErrorAction SilentlyContinue).Source
    if (-not $pwsh) { $pwsh = "powershell" }

    $config = @{
        mcpServers = @{
            "github-mcp-server" = @{
                command = $pwsh
                args = @("-NoProfile", "-NoLogo", "-ExecutionPolicy", "Bypass", "-File", (Join-Path $bridgesDir "github-bridge.ps1"))
                env = @{ PATH = $enhancedPath }
                disabledTools = @("merge_pull_request")
            }
            "supabase" = @{
                command = $pwsh
                args = @("-NoProfile", "-NoLogo", "-ExecutionPolicy", "Bypass", "-File", (Join-Path $bridgesDir "supabase-bridge.ps1"))
                env = @{ PATH = $enhancedPath }
            }
            "grok-build-delegate" = @{
                command = $pwsh
                args = @("-NoProfile", "-NoLogo", "-ExecutionPolicy", "Bypass", "-File", (Join-Path $bridgesDir "grok-build-bridge.ps1"))
                env = @{ PATH = $enhancedPath }
                disabled = $false
            }
        }
    }
} else {
    $raw = Get-Content $templatePath -Raw
    $raw = $raw.Replace("__DOCKER_EXE__", ($dockerExe -replace '\\', '\\'))
    $raw = $raw.Replace("__PYTHON_EXE__", ($pythonExe -replace '\\', '\\'))
    $raw = $raw.Replace("__GROK_DELEGATE_SCRIPT__", ($grokScript -replace '\\', '\\'))
    $raw = $raw.Replace("__ENHANCED_PATH__", ($enhancedPath -replace '\\', '\\'))
    $raw = $raw.Replace("__SUPABASE_PROJECT_REF__", $supabaseRef)
    $raw = $raw.Replace("__SUPABASE_ACCESS_TOKEN__", $supabaseToken)
    $config = $raw | ConvertFrom-Json
}

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$configJson = $config | ConvertTo-Json -Depth 10

foreach ($target in $antigravityConfigs) {
    $parent = Split-Path $target -Parent
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Force -Path $parent | Out-Null
    }
    if (Test-Path $target) {
        Copy-Item $target (Join-Path $backupDir "$(Split-Path $target -Leaf).$timestamp.bak") -Force
    }
    $configJson | Set-Content $target -Encoding UTF8
    Write-Host "[applied] $target"
}

# Update Grok user config with project-scoped servers
$grokConfig = Join-Path $env:USERPROFILE ".grok\config.toml"
$grokBuildArgs = (Get-GrokBuildArgs $grokScript) | ForEach-Object { '"' + ($_ -replace '\\', '/') + '"' }
$grokBuildArgsJson = ($grokBuildArgs -join ", ")

$grokMcpBlock = @"

# MCP servers - managed by laslogtmx infra/mcp/apply-mcp-config.ps1
[mcp_servers.github]
command = "$($dockerExe -replace '\\', '/')"
args = ["run", "-i", "--rm", "--pull=missing", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN", "ghcr.io/github/github-mcp-server"]
enabled = true
startup_timeout_sec = 30

[mcp_servers.supabase]
url = "https://mcp.supabase.com/mcp?project_ref=`${SUPABASE_PROJECT_REF}"
headers = { Authorization = "Bearer `${SUPABASE_ACCESS_TOKEN}" }
enabled = true

[mcp_servers.grok-build]
command = "$($pythonExe -replace '\\', '/')"
args = [$grokBuildArgsJson]
enabled = true
startup_timeout_sec = 30
"@

if (Test-Path $grokConfig) {
    $existing = Get-Content $grokConfig -Raw
    if ($existing -notmatch '\[mcp_servers\.github\]') {
        Add-Content $grokConfig $grokMcpBlock
        Write-Host "[applied] $grokConfig (appended MCP block)"
    }
} else {
    $grokMcpBlock | Set-Content $grokConfig -Encoding UTF8
    Write-Host "[created] $grokConfig"
}

Write-Host ""
Write-Host "MCP config applied. Restart Antigravity IDE, then run: .\infra\mcp\verify-mcp.ps1" -ForegroundColor Green