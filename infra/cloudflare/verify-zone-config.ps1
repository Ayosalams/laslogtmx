#Requires -Version 5.1
<#
.SYNOPSIS
  Audit laslogTMX Cloudflare zone against infra/cloudflare/*.manifest.json
.USAGE
  .\infra\cloudflare\verify-zone-config.ps1
  Requires: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID in User env vars
#>
$ErrorActionPreference = "Stop"
$token = [Environment]::GetEnvironmentVariable("CLOUDFLARE_API_TOKEN", "User")
$zone  = [Environment]::GetEnvironmentVariable("CLOUDFLARE_ZONE_ID", "User")
if (-not $token -or -not $zone) { throw "Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID in User env vars." }

$h = @{ Authorization = "Bearer $token" }
$root = Split-Path $PSScriptRoot -Parent | Split-Path -Parent
$manifest = Get-Content (Join-Path $PSScriptRoot "rules-manifest.json") -Raw | ConvertFrom-Json

Write-Host "=== laslogTMX Cloudflare Audit ===" -ForegroundColor Cyan
Write-Host "Zone: $($manifest.zone) ($zone)"

# Token
$verify = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/user/tokens/verify" -Headers $h
Write-Host "Token: $($verify.result.status)"

# DNS
Write-Host "`n--- DNS ---" -ForegroundColor Yellow
$dns = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zone/dns_records?per_page=100" -Headers $h
$dns.result | ForEach-Object { Write-Host "$($_.type) $($_.name) -> $($_.content) proxied=$($_.proxied)" }

# Live site check
Write-Host "`n--- Live domains ---" -ForegroundColor Yellow
foreach ($d in @("https://laslogtmx.com", "https://app.laslogtmx.com", "https://dev.laslogtmx.com")) {
    try {
        $r = Invoke-WebRequest -Uri $d -UseBasicParsing -TimeoutSec 15
        $hsts = $r.Headers["Strict-Transport-Security"]
        Write-Host "$d -> $($r.StatusCode) HSTS=$(if ($hsts) { 'yes' } else { 'no' })"
    } catch { Write-Host "$d -> ERROR $($_.Exception.Message)" }
}

# WAF custom rules
Write-Host "`n--- WAF custom rules ---" -ForegroundColor Yellow
try {
    $entry = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zone/rulesets/phases/http_request_firewall_custom/entrypoint" -Headers $h
    $expected = $manifest.waf.custom_rules | ForEach-Object { $_.name }
    $actual = $entry.result.rules | ForEach-Object { $_.description }
    foreach ($e in $expected) {
        $ok = $actual -contains $e
        Write-Host "$(if ($ok) { '[OK]' } else { '[MISSING]' }) $e"
    }
    foreach ($a in $actual) {
        if ($expected -notcontains $a) { Write-Host "[EXTRA] $a" }
    }
} catch { Write-Host "WAF audit failed: $($_.Exception.Message)" }

# Other phases (may 403 on limited tokens)
Write-Host "`n--- Other rulesets (redirect/cache/transform) ---" -ForegroundColor Yellow
foreach ($phase in @("http_request_dynamic_redirect", "http_request_cache_settings", "http_response_headers_transform")) {
    try {
        $r = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zone/rulesets/phases/$phase/entrypoint" -Headers $h
        Write-Host "$phase -> $($r.result.rules.Count) rules"
    } catch { Write-Host "$phase -> cannot read ($($_.Exception.Message))" }
}

Write-Host "`n--- Manual dashboard items ---" -ForegroundColor Yellow
@(
    "Zone Settings: SSL strict, Always HTTPS, minify, brotli, HTTP/3, WebSockets",
    "Redirect/Cache/Transform rules (if API token lacks Zone Settings Edit)",
    "Rate limiting rules (3 rules in rules-manifest.json)",
    "Error Pages: upload infra/cloudflare/error-pages/*.html",
    "Cloudflare Access on dev.laslogtmx.com (access-dev.manifest.json)",
    "Email routing go-live (email-routing.manifest.json)",
    "CF Pages env vars per project (pages-env-checklist.json)"
) | ForEach-Object { Write-Host "  [ ] $_" }

Write-Host "`nDone." -ForegroundColor Green