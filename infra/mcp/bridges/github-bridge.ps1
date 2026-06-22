# GitHub MCP bridge — uses absolute Docker path and host env token (no secrets in config).
$ErrorActionPreference = "Stop"

$dockerExe = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"
if (-not (Test-Path $dockerExe)) {
    $dockerExe = (Get-Command docker -ErrorAction SilentlyContinue).Source
}
if (-not $dockerExe) {
    Write-Error "Docker not found. Install Docker Desktop and ensure it is running."
}

if (-not $env:GITHUB_PERSONAL_ACCESS_TOKEN) {
    Write-Error "GITHUB_PERSONAL_ACCESS_TOKEN is not set. Add it to Windows User Environment Variables."
}

# Fix: Pull image first, redirecting all pull progress (stdout) to stderr so it doesn't corrupt MCP JSON
& $dockerExe pull ghcr.io/github/github-mcp-server *>&2

# Fix: Remove --pull=missing from run, as we already pulled it above
& $dockerExe run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server