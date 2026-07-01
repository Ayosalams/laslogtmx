#Requires -Version 5.1
<#
.SYNOPSIS
  Apply laslogTMX Cloudflare zone rules from rules-manifest.json
.USAGE
  .\infra\cloudflare\apply-zone-config.ps1          # apply WAF rules
  .\infra\cloudflare\apply-zone-config.ps1 -WhatIf  # dry run
.NOTES
  Token needs: Zone.WAF Edit (works), Zone Settings Edit (for redirect/cache/speed).
  Upgrade token at: https://dash.cloudflare.com/profile/api-tokens
#>
param([switch]$WhatIf)

$ErrorActionPreference = "Stop"
$token = [Environment]::GetEnvironmentVariable("CLOUDFLARE_API_TOKEN", "User")
$zone  = [Environment]::GetEnvironmentVariable("CLOUDFLARE_ZONE_ID", "User")
if (-not $token -or -not $zone) { throw "Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID." }

$h = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
$manifestPath = Join-Path $PSScriptRoot "rules-manifest.json"
$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json

Write-Host "Applying Cloudflare config for $($manifest.zone)..." -ForegroundColor Cyan

# --- WAF custom rules (preserve existing rules not in manifest) ---
$entry = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zone/rulesets/phases/http_request_firewall_custom/entrypoint" -Headers $h
$rulesetId = $entry.result.id
$existing = @($entry.result.rules)
$manifestNames = $manifest.waf.custom_rules | ForEach-Object { $_.name }

$kept = $existing | Where-Object { $manifestNames -notcontains $_.description }
$newRules = @()
foreach ($r in $manifest.waf.custom_rules) {
    $newRules += @{
        action      = $r.action
        description = $r.name
        enabled     = $true
        expression  = $r.expression
    }
}
$finalRules = @()
foreach ($k in $kept) {
    $rule = @{ action = $k.action; description = $k.description; enabled = $k.enabled; expression = $k.expression }
    if ($k.id) { $rule.id = $k.id }
    $finalRules += $rule
}
$finalRules += $newRules

Write-Host "WAF: $($finalRules.Count) rules ($($kept.Count) preserved + $($newRules.Count) from manifest)"
if (-not $WhatIf) {
    $body = @{ rules = $finalRules } | ConvertTo-Json -Depth 8
    $r = Invoke-RestMethod -Method Put -Uri "https://api.cloudflare.com/client/v4/zones/$zone/rulesets/$rulesetId" -Headers $h -Body $body
    Write-Host "WAF applied." -ForegroundColor Green
}

# --- Redirect rules ---
$redirectRules = @()
foreach ($rr in $manifest.redirect_rules) {
    $redirectRules += @{
        description = $rr.name
        enabled = $true
        expression = $rr.expression
        action = "redirect"
        action_parameters = @{
            from_value = @{
                status_code = $rr.status_code
                target_url = @{ value = $rr.target }
            }
        }
    }
}
Write-Host "Redirect rules: $($redirectRules.Count)"
if (-not $WhatIf) {
    try {
        $body = @{ rules = $redirectRules } | ConvertTo-Json -Depth 10
        Invoke-RestMethod -Method Put -Uri "https://api.cloudflare.com/client/v4/zones/$zone/rulesets/phases/http_request_dynamic_redirect/entrypoint" -Headers $h -Body $body | Out-Null
        Write-Host "Redirects applied." -ForegroundColor Green
    } catch { Write-Host "Redirects skipped (token needs Zone Settings Edit): $($_.Exception.Message)" -ForegroundColor Yellow }
}

# --- Cache rules ---
$cacheRules = @()
foreach ($cr in $manifest.cache_rules) {
    $ap = if ($cr.action -eq "bypass_cache") { @{ cache = $false } }
          else { @{ cache = $true; edge_ttl = @{ mode = "override_origin"; default = $cr.edge_ttl }; browser_ttl = @{ mode = "override_origin"; default = $cr.browser_ttl } } }
    $cacheRules += @{ description = $cr.name; enabled = $true; expression = $cr.expression; action = "set_cache_settings"; action_parameters = $ap }
}
if (-not $WhatIf) {
    try {
        $body = @{ rules = $cacheRules } | ConvertTo-Json -Depth 10
        Invoke-RestMethod -Method Put -Uri "https://api.cloudflare.com/client/v4/zones/$zone/rulesets/phases/http_request_cache_settings/entrypoint" -Headers $h -Body $body | Out-Null
        Write-Host "Cache rules applied." -ForegroundColor Green
    } catch { Write-Host "Cache rules skipped: $($_.Exception.Message)" -ForegroundColor Yellow }
}

# --- Transform rules (response + request phases) ---
$responseRules = @()
$requestRules = @()
foreach ($tr in $manifest.transform_rules) {
    $hdrs = @{}
    foreach ($prop in $tr.headers.PSObject.Properties) {
        $hdrs[$prop.Name] = @{ operation = "set"; value = $prop.Value }
    }
    $rule = @{ description = $tr.name; enabled = $true; expression = $tr.expression; action = "rewrite"; action_parameters = @{ headers = $hdrs } }
    if ($tr.type -eq "request") { $requestRules += $rule } else { $responseRules += $rule }
}
if (-not $WhatIf) {
    if ($responseRules.Count -gt 0) {
        try {
            $body = @{ rules = $responseRules } | ConvertTo-Json -Depth 10
            Invoke-RestMethod -Method Put -Uri "https://api.cloudflare.com/client/v4/zones/$zone/rulesets/phases/http_response_headers_transform/entrypoint" -Headers $h -Body $body | Out-Null
            Write-Host "Response transform rules applied." -ForegroundColor Green
        } catch { Write-Host "Response transform skipped: $($_.Exception.Message)" -ForegroundColor Yellow }
    }
    if ($requestRules.Count -gt 0) {
        try {
            $body = @{ rules = $requestRules } | ConvertTo-Json -Depth 10
            Invoke-RestMethod -Method Put -Uri "https://api.cloudflare.com/client/v4/zones/$zone/rulesets/phases/http_request_late_transform/entrypoint" -Headers $h -Body $body | Out-Null
            Write-Host "Request transform rules applied." -ForegroundColor Green
        } catch { Write-Host "Request transform skipped: $($_.Exception.Message)" -ForegroundColor Yellow }
    }
}

# --- Zone settings ---
$zs = Get-Content (Join-Path $PSScriptRoot "zone-settings.manifest.json") -Raw | ConvertFrom-Json
$settingMap = @{
    ssl = $zs.ssl_tls.ssl
    always_use_https = $zs.ssl_tls.always_use_https
    brotli = $zs.speed.brotli
    http3 = $zs.network.http3
    websockets = $zs.network.websockets
    minify = $zs.speed.minify
}
foreach ($kv in $settingMap.GetEnumerator()) {
    if ($WhatIf) { Write-Host "Would set $($kv.Key) = $($kv.Value)"; continue }
    try {
        $body = @{ value = $kv.Value } | ConvertTo-Json -Depth 5
        Invoke-RestMethod -Method Patch -Uri "https://api.cloudflare.com/client/v4/zones/$zone/settings/$($kv.Key)" -Headers $h -Body $body | Out-Null
        Write-Host "Setting $($kv.Key) applied." -ForegroundColor Green
    } catch { Write-Host "Setting $($kv.Key) skipped: $($_.Exception.Message)" -ForegroundColor Yellow }
}

Write-Host "`nManual steps remaining:" -ForegroundColor Cyan
Write-Host "  - Error pages: Dashboard -> Rules -> Error Pages -> upload infra/cloudflare/error-pages/"
Write-Host "  - Access: see access-dev.manifest.json"
Write-Host "  - Email: see email-routing.manifest.json (before go-live)"
Write-Host "  - Pages env: see pages-env-checklist.json"
Write-Host "  - Run verify: .\infra\cloudflare\verify-zone-config.ps1"