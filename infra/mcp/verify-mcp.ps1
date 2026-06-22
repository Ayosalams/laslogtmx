# Verifies MCP prerequisites: Docker, Supabase PAT, GitHub PAT, Grok CLI.
$ErrorActionPreference = "Continue"
$results = @()

function Add-Result([string]$Name, [bool]$Ok, [string]$Detail) {
    $script:results += [PSCustomObject]@{ Service = $Name; Status = $(if ($Ok) { "OK" } else { "FAIL" }); Detail = $Detail }
}

# Docker
$dockerExe = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"
if (-not (Test-Path $dockerExe)) { $dockerExe = (Get-Command docker -ErrorAction SilentlyContinue).Source }
if ($dockerExe) {
    try {
        $ver = & $dockerExe version --format "{{.Server.Version}}" 2>&1
        Add-Result "Docker Desktop" $true "Server version $ver"
    } catch {
        Add-Result "Docker Desktop" $false "Installed but daemon not reachable. Start Docker Desktop."
    }
} else {
    Add-Result "Docker Desktop" $false "docker.exe not found"
}

# GitHub PAT
$gh = [Environment]::GetEnvironmentVariable("GITHUB_PERSONAL_ACCESS_TOKEN", "User")
Add-Result "GitHub PAT" ([bool]$gh) $(if ($gh) { "Set in user env vars" } else { "GITHUB_PERSONAL_ACCESS_TOKEN not set" })

# Supabase PAT + project ref (PAT supersedes legacy IDE OAuth tokens)
$ref = [Environment]::GetEnvironmentVariable("SUPABASE_PROJECT_REF", "User")
$pat = [Environment]::GetEnvironmentVariable("SUPABASE_ACCESS_TOKEN", "User")
Add-Result "Supabase project ref" ([bool]$ref) $(if ($ref) { "SUPABASE_PROJECT_REF set" } else { "SUPABASE_PROJECT_REF not set" })

$patOk = $false
$patDetail = "SUPABASE_ACCESS_TOKEN not set - generate at supabase.com/dashboard/account/tokens"
if ($pat) {
    try {
        $uri = if ($ref) { "https://api.supabase.com/v1/projects/$ref" } else { "https://api.supabase.com/v1/projects" }
        $project = Invoke-RestMethod -Uri $uri -Headers @{ Authorization = "Bearer $pat" } -Method Get
        $patOk = $true
        $projectName = if ($ref) { $project.name } else { "account" }
        $patDetail = "PAT valid for $projectName (legacy OAuth ignored)"
    } catch {
        $patDetail = "SUPABASE_ACCESS_TOKEN invalid or unreachable: $($_.Exception.Message)"
    }
}
Add-Result "Supabase access token" $patOk $patDetail

# Grok CLI
$grokExe = Join-Path $env:USERPROFILE ".grok\bin\grok.exe"
if (Test-Path $grokExe) {
    try {
        $ver = & $grokExe --version 2>&1
        Add-Result "Grok Build CLI" $true $ver
    } catch {
        Add-Result "Grok Build CLI" $false "grok.exe failed to run"
    }
} else {
    Add-Result "Grok Build CLI" $false "grok.exe not found at $grokExe"
}

# Grok delegate script
$delegate = Join-Path $env:USERPROFILE ".grok-mcp\grok_delegate_mcp.py"
Add-Result "Grok Build delegate" (Test-Path $delegate) $(if (Test-Path $delegate) { "Script present" } else { "Missing $delegate" })

# Python
$py = Get-Command python -ErrorAction SilentlyContinue
Add-Result "Python" ([bool]$py) $(if ($py) { $py.Source } else { "python not in PATH" })

# Antigravity configs
foreach ($cfg in @(
    (Join-Path $env:USERPROFILE ".gemini\antigravity-ide\mcp_config.json"),
    (Join-Path $env:USERPROFILE ".gemini\config\mcp_config.json")
)) {
    if (Test-Path $cfg) {
        $raw = Get-Content $cfg -Raw
        $hasHardcodedGh = $raw -match 'github_pat_'
        $hasHardcodedXai = $raw -match 'xai-'
        $hasGrokBuild = $raw -match 'grok-build-delegate'
        $name = Split-Path $cfg -Leaf
        Add-Result "$name (no hardcoded secrets)" (-not ($hasHardcodedGh -or $hasHardcodedXai)) $(if ($hasHardcodedGh -or $hasHardcodedXai) { "Contains hardcoded tokens - run apply-mcp-config.ps1" } else { "Sanitized" })
        Add-Result "$name (grok-build)" $hasGrokBuild $(if ($hasGrokBuild) { "grok-build-delegate configured" } else { "Missing grok-build-delegate" })
    }
}

Write-Host ""
$results | Format-Table -AutoSize
$failCount = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
if ($failCount -eq 0) {
    Write-Host "All checks passed. Restart Antigravity IDE to reload MCP servers." -ForegroundColor Green
    exit 0
} else {
    Write-Host "$failCount check(s) failed. See details above." -ForegroundColor Yellow
    exit 1
}