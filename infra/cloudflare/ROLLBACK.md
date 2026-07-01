# laslogTMX Cloudflare Rollback Plan

Use this if a configuration change breaks `laslogtmx.com`, `app.laslogtmx.com`, or `dev.laslogtmx.com`.

## Before every change

1. Screenshot current Cloudflare dashboard settings (DNS, Rules, SSL/TLS).
2. Note the active deployment ID per Pages project (Deployments tab).
3. Filesystem backup: `C:\Users\Ayoni\OneDrive\Desktop\Antigravity\Backups\laslogtmx_YYYYMMDD_HHMM\`
4. Run audit: `.\infra\cloudflare\verify-zone-config.ps1`

## Fast rollback by symptom

| Symptom | Rollback action | Recovery time |
|---------|-----------------|---------------|
| Site returns 5xx | Pages → project → Deployments → **Rollback** to previous | 1–3 min |
| WAF blocking legit users | Security → WAF → Custom rules → set rule to **Log** or disable | Immediate |
| Rate limit too aggressive | Security → WAF → Rate limiting → disable or raise threshold | Immediate |
| Cache serving stale auth | Caching → Purge Everything; or disable cache rule for `/auth/*` | 1–5 min |
| Redirect loop | Rules → Redirect Rules → disable last added rule | Immediate |
| SSL errors | SSL/TLS → set mode to **Full** (not Flexible) | 1–5 min |
| dev.laslogtmx.com Access lockout | Zero Trust → Access → disable staging policy | Immediate |
| Email stopped after MX change | DNS → restore MX from `email-routing.manifest.json` rollback section | TTL (~5 min) |
| DNS total failure | DNS → grey-cloud (DNS only) records; point to `*.pages.dev` hostname | 5–15 min |

## Per-domain rollback

### laslogtmx.com (marketing)
```
Dashboard → Pages → laslogtmx-marketing → Deployments → Rollback
```

### app.laslogtmx.com (production app)
```
Dashboard → Pages → laslogtmx-app → Deployments → Rollback
Check env vars were not changed in same session
```

### dev.laslogtmx.com (staging)
```
Dashboard → Pages → laslogtmx-dev → Deployments → Rollback
Staging rollback does NOT affect production
```

## WAF rules rollback (API)

Re-apply previous ruleset from backup or run:
```powershell
# Restore single rule to Log mode in dashboard, or:
.\infra\cloudflare\apply-zone-config.ps1   # re-sync from rules-manifest.json
```

Live WAF snapshot before 2026-07-01 session:
- `WAF` — block `ip.src.country eq "AF"`

## Git / code rollback

```powershell
cd C:\Users\Ayoni\OneDrive\Desktop\Antigravity\laslogtmx
git log --oneline -10
git revert HEAD
git push origin main
# CF Pages auto-redeploys from main (~3 min)
```

## Emergency: bypass Cloudflare

1. DNS → set records to **DNS only** (grey cloud).
2. Point CNAME to Pages `*.pages.dev` URL.
3. You lose WAF/cache but site stays reachable.

## Priority order

1. Test all rule changes on **dev** first.
2. Then **app** (revenue-critical).
3. **Marketing** last (static, lowest risk).