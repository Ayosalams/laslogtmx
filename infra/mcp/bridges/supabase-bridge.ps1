# Supabase MCP bridge — PAT auth (persistent; no OAuth token expiry on IDE restart).
$ErrorActionPreference = "Stop"

$projectRef = $env:SUPABASE_PROJECT_REF
$accessToken = $env:SUPABASE_ACCESS_TOKEN

if (-not $projectRef) {
    Write-Error "SUPABASE_PROJECT_REF is not set. Add it to Windows User Environment Variables."
}
if (-not $accessToken) {
    Write-Error "SUPABASE_ACCESS_TOKEN is not set. Generate a PAT at https://supabase.com/dashboard/account/tokens"
}

$mcpUrl = "https://mcp.supabase.com/mcp?project_ref=$projectRef"
$npxCmd = (Get-Command npx.cmd -ErrorAction SilentlyContinue).Source
if (-not $npxCmd) { $npxCmd = "npx" }

# Fix: Use --quiet to suppress npx installation output that corrupts MCP JSON
& $npxCmd --yes --quiet mcp-remote@0.1.38 $mcpUrl --header "Authorization: Bearer $accessToken"