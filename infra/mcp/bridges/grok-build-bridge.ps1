# Grok Build delegate bridge — runs the local grok_delegate_mcp.py via Python.
$ErrorActionPreference = "Stop"

$scriptPath = Join-Path $env:USERPROFILE ".grok-mcp\grok_delegate_mcp.py"
if (-not (Test-Path $scriptPath)) {
    Write-Error "Grok delegate script not found at $scriptPath"
}

$grokBin = Join-Path $env:USERPROFILE ".grok\bin"
if (Test-Path $grokBin) {
    $env:PATH = "$grokBin;$env:PATH"
}

$uvExe = (Get-Command uv -ErrorAction SilentlyContinue).Source
if ($uvExe) {
    # Fix: Use --quiet so uv resolution logs don't corrupt MCP JSON
    & $uvExe run --quiet $scriptPath
    exit $LASTEXITCODE
}

$pythonExe = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $pythonExe) {
    Write-Error "Neither uv nor python found in PATH. Install uv: https://docs.astral.sh/uv/"
}

& $pythonExe $scriptPath