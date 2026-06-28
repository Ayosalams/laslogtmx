---
name: backup-rollback
description: >
  Mandatory pre-change backup rules for laslogTMX. Create timestamped backup
  in ../Backups/ before ANY file change or deployment. Triggers: backup,
  rollback, before edit, before deploy, pre-change, restore, safety snapshot.
metadata:
  short-description: "Pre-change backup and rollback for laslogtmx"
---

# Backup & Rollback

**Mandatory before ANY file change or deployment.**

## Backup Location

```
C:\Users\Ayoni\OneDrive\Desktop\Antigravity\Backups\laslogtmx_YYYYMMDD_HHMM\
```

Pattern: `laslogtmx_` + `YYYYMMDD` + `_` + `HHMM` (24-hour local time).

Example: `laslogtmx_20260626_2130`

## When to Backup

| Trigger | Required |
|---------|----------|
| Any file edit (agent or user) | **Yes** |
| Deployment (Cloudflare, Supabase migration apply) | **Yes** |
| MCP-driven schema changes | **Yes** |
| Git operations that modify working tree | **Yes** |
| Read-only exploration | No |

If backup already exists for the current session (same hour), append changed files only — do not skip the backup step entirely.

## How to Create Backup (PowerShell)

From project root (`laslogtmx`):

```powershell
$timestamp = Get-Date -Format "yyyyMMdd_HHmm"
$backupRoot = Join-Path (Split-Path $PWD -Parent) "Backups"
$dest = Join-Path $backupRoot "laslogtmx_$timestamp"
New-Item -ItemType Directory -Force -Path $dest | Out-Null

# Copy changed files only (if known), OR snapshot critical paths:
$critical = @(
    "apps", "packages", "features", "lib", "supabase",
    "infra", "integrations", "skills", ".grok", "package.json", "turbo.json"
)
foreach ($item in $critical) {
    if (Test-Path $item) {
        Copy-Item $item -Destination $dest -Recurse -Force
    }
}
Write-Host "Backup created: $dest"
```

For **single-file changes**, copy only the affected file(s) into the same timestamped folder, preserving relative paths.

## Exclusions (Do Not Copy)

- `node_modules/`
- `.git/`
- `.next/`, `.open-next/`, `out/`, `dist/`, `build/`
- `*.log`, `tsconfig.tsbuildinfo`
- `.env`, `.env.local`, `supabase/.env.local` (secrets stay out of backups)
- Large binary caches

## Git Backup (Complement)

In addition to filesystem backup, before major changes:

```powershell
git stash push -m "pre-change-$timestamp"   # if uncommitted work exists
git branch "backup/laslogtmx-$timestamp"
```

Prefer filesystem backup for agent-driven edits; git branch for multi-file refactors.

## Rollback

1. Identify backup folder: `../Backups/laslogtmx_YYYYMMDD_HHMM/`
2. Restore specific file: `Copy-Item "$backup\path\to\file" -Destination "path\to\file" -Force`
3. Full restore: copy backup subtree back to project root (confirm with user first).
4. Git rollback: `git checkout backup/laslogtmx-YYYYMMDD_HHMM -- <path>`

**Always confirm with user before full rollback.**

## Agent Rules

1. State backup path in your response before making changes: `Backup: ../Backups/laslogtmx_YYYYMMDD_HHMM/`
2. If backup fails, **STOP** — do not proceed with edits.
3. Never delete backup folders without explicit user approval.
4. Keep last 10 backups; suggest pruning older ones to the user.