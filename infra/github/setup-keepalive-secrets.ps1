# Push Supabase keep-alive credentials to GitHub Actions secrets.
# Reads from .env.local (never prints secret values).
# Requires: GITHUB_PERSONAL_ACCESS_TOKEN in user environment variables.

$ErrorActionPreference = "Stop"
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$script = Join-Path $PSScriptRoot "setup-keepalive-secrets.py"

if (-not (Test-Path $script)) {
    Write-Error "Missing $script"
}

$token = [Environment]::GetEnvironmentVariable("GITHUB_PERSONAL_ACCESS_TOKEN", "User")
if (-not $token) {
    Write-Error "GITHUB_PERSONAL_ACCESS_TOKEN is not set in Windows User Environment Variables."
}

$env:GITHUB_PERSONAL_ACCESS_TOKEN = $token

python -m pip install --quiet pynacl 2>$null
python $script