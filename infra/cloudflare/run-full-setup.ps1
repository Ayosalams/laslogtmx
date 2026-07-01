#Requires -Version 5.1
<#
.SYNOPSIS
  Full laslogTMX Cloudflare setup using laslogtmx-Setup-Token (or CLOUDFLARE_API_TOKEN).
.USAGE
  # Option A — token already in Windows User env vars:
  .\infra\cloudflare\run-full-setup.ps1

  # Option B — pass token for this session only (not saved):
  .\infra\cloudflare\run-full-setup.ps1 -Token "YOUR_TOKEN_HERE"

  # Dry run:
  .\infra\cloudflare\run-full-setup.ps1 -WhatIf
#>
param(
    [string]$Token,
    [switch]$WhatIf
)

$ErrorActionPreference = "Stop"
$scriptDir = $PSScriptRoot

if ($Token) {
    $env:CLOUDFLARE_API_TOKEN = $Token
    Write-Host "Using token from -Token parameter (session only)." -ForegroundColor Cyan
}

$token = [Environment]::GetEnvironmentVariable("CLOUDFLARE_API_TOKEN", "User")
if (-not $token) { $token = $env:CLOUDFLARE_API_TOKEN }
$zone  = [Environment]::GetEnvironmentVariable("CLOUDFLARE_ZONE_ID", "User")
$acct  = [Environment]::GetEnvironmentVariable("CLOUDFLARE_ACCOUNT_ID", "User")

if (-not $token) {
    Write-Host @"

CLOUDFLARE_API_TOKEN is not set.

After creating laslogtmx-Setup-Token in the dashboard:
  1. Windows Settings -> System -> About -> Advanced system settings
  2. Environment Variables -> User variables -> CLOUDFLARE_API_TOKEN -> Edit
  3. Paste the new token value (shown once at creation)
  4. Restart terminal / Cursor, then re-run this script

Or run once with: .\run-full-setup.ps1 -Token `"<paste-here>`"

"@ -ForegroundColor Yellow
    exit 1
}

$h = @{ Authorization = "Bearer $token" }

Write-Host "=== Token probe ===" -ForegroundColor Cyan
$verify = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/user/tokens/verify" -Headers $h
Write-Host "Token ID: $($verify.result.id) | Status: $($verify.result.status)"

$probes = @{
    "Zone Settings (ssl)"     = "https://api.cloudflare.com/client/v4/zones/$zone/settings/ssl"
    "Redirect rules"          = "https://api.cloudflare.com/client/v4/zones/$zone/rulesets/phases/http_request_dynamic_redirect/entrypoint"
    "Cache rules"             = "https://api.cloudflare.com/client/v4/zones/$zone/rulesets/phases/http_request_cache_settings/entrypoint"
    "Pages projects"          = "https://api.cloudflare.com/client/v4/accounts/$acct/pages/projects"
}
$ok = 0
foreach ($kv in $probes.GetEnumerator()) {
    try {
        Invoke-RestMethod -Uri $kv.Value -Headers $h | Out-Null
        Write-Host "[OK] $($kv.Key)" -ForegroundColor Green
        $ok++
    } catch {
        Write-Host "[FAIL] $($kv.Key) — $($_.Exception.Message)" -ForegroundColor Red
    }
}

if ($ok -lt 2) {
    Write-Host "`nToken still lacks permissions. Ensure laslogtmx-Setup-Token is saved to CLOUDFLARE_API_TOKEN." -ForegroundColor Yellow
    Write-Host "Required: Zone Settings Edit, Zone WAF Edit, Account Cloudflare Pages Edit" -ForegroundColor Yellow
    exit 2
}

Write-Host "`n=== Applying zone config ===" -ForegroundColor Cyan
& (Join-Path $scriptDir "apply-zone-config.ps1") @PSBoundParameters

Write-Host "`n=== Rate limiting ===" -ForegroundColor Cyan
$manifest = Get-Content (Join-Path $scriptDir "rules-manifest.json") -Raw | ConvertFrom-Json
$rateRules = @()
foreach ($rl in $manifest.rate_limiting) {
    $rateRules += @{
        description = $rl.name
        enabled     = $true
        expression  = $rl.expression
        action      = $rl.action
        ratelimit   = @{
            characteristics     = @("ip.src", "cf.colo.id")
            period              = $rl.period_seconds
            requests_per_period = $rl.requests_per_period
            mitigation_timeout  = $rl.timeout_seconds
        }
    }
}
if (-not $WhatIf) {
    try {
        $body = @{ rules = $rateRules } | ConvertTo-Json -Depth 12
        Invoke-RestMethod -Method Put -Uri "https://api.cloudflare.com/client/v4/zones/$zone/rulesets/phases/http_ratelimit/entrypoint" -Headers (@{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }) -Body $body | Out-Null
        Write-Host "Rate limits applied." -ForegroundColor Green
    } catch {
        Write-Host "Rate limits: $($_.Exception.Message) — apply manually in Security -> WAF -> Rate limiting rules" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Verify ===" -ForegroundColor Cyan
& (Join-Path $scriptDir "verify-zone-config.ps1")

Write-Host "`n=== Manual (dashboard) ===" -ForegroundColor Cyan
Write-Host "  [ ] Error Pages: upload infra/cloudflare/error-pages/*.html"
Write-Host "  [ ] Access: Zero Trust -> Access -> dev.laslogtmx.com (access-dev.manifest.json)"
Write-Host "  [ ] Pages env vars: pages-env-checklist.json"
Write-Host "  [ ] Email go-live LAST: email-routing.manifest.json"
Write-Host "`nDone." -ForegroundColor Green