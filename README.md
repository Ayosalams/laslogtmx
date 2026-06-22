# laslogTMX

**Transport Management Xperience** — Modern mobile-first TMS for carriers, brokers & 3PLs.

## Architecture
- **Web**: Next.js 15 + Tailwind (Cloudflare Pages)
- **Mobile**: Expo (React Native)
- **Backend**: Supabase
- **Monorepo**: Turborepo
- **Domains**: laslogtmx.com (marketing), app.laslogtmx.com (app), dev.laslogtmx.com (staging)
- **Legacy redirects**: laslogs.cc → laslogtmx.com (301, configured in Cloudflare + `_redirects`)

## Quick Start
1. Copy `.env.example` → `.env.local` and fill in Supabase keys manually
2. `npm install`
3. `npm run dev:web` (web) or `npm run dev:mobile` (mobile)

## Cloudflare Deployment

Security and routing are defined in `infra/cloudflare/rules-manifest.json` and applied at the zone level:

| Setting | Status | Location |
|---------|--------|----------|
| HSTS (preload) | Enabled | `_headers` + zone SSL/TLS |
| WAF (managed + OWASP) | Deployed | Cloudflare dashboard |
| Page Shield | Enabled | Cloudflare dashboard |
| Redirect Rules | Deployed | laslogs.cc → laslogtmx.com |
| Cache Rules | Deployed | API/auth bypass, static assets cached |
| Transform Rules | Deployed | Security headers + IP passthrough |
| Rate Limiting | Deployed | signup-risk, push, auth endpoints |

Pages config: `apps/web/wrangler.toml`

### Staging (dev.laslogtmx.com)

1. Create a `dev` branch in the repo
2. In Cloudflare Pages → **dev** branch → add custom domain `dev.laslogtmx.com`
3. Set branch env vars:
   - `NEXT_PUBLIC_APP_URL=https://dev.laslogtmx.com`
   - `NEXT_PUBLIC_WEB_APP_URL=https://dev.laslogtmx.com`
4. Deploy; staging uses the same Supabase project (add `dev.laslogtmx.com` to Supabase Auth redirect URLs)

Checkpoint: [`.agents/checkpoints/cloudflare-setup.json`](.agents/checkpoints/cloudflare-setup.json)

## Key Features
- Military Time default
- Company + Load-specific Chat
- Receipt OCR with correction
- FMCSA Compliance Hub
- MOTUS Helper
- Make.com integrations (QuickBooks, DAT, etc.)
- Basic fraud prevention on signup

## Fraud Prevention

Lean signup abuse controls — no paid vendor, tuned for a one-man shop.

### Rules (enforced in Supabase)

| Rule | Limit / trigger | Action |
|------|-----------------|--------|
| Email velocity | Max **2** signups per email / 24h | Block signup |
| IP velocity | Max **2** signups per IP / 24h | Block signup |
| Fingerprint velocity | Max **2** signups per device fingerprint / 24h | Block signup |
| Disposable email | mailinator, guerrillamail, tempmail, etc. | Allow but **flag** `high_risk:disposable_email` |
| Suspicious local part | `test@`, `temp@`, `fake@`, `spam@`, `admin@` | Flag `high_risk:suspicious_local_part` |
| Plus-alias farming | `user+123@` patterns | Flag `high_risk:plus_alias_pattern` |

Primary enforcement runs **before** account creation via `assess_signup_risk` RPC. Every signup logs a `signup_attempt` row in `fraud_flags`; high-risk signals add `high_risk:*` rows for manual review.

### Make.com (secondary alerting)

Blueprint: [`integrations/make/signup-fraud-velocity.json`](integrations/make/signup-fraud-velocity.json)

1. Webhook trigger on `fraud_flags` INSERT (Supabase Database Webhook)
2. Query signup attempts in last 24h for same email or IP
3. If count ≥ 2 → Slack/email alert + `make_velocity_alert` row
4. If `reason` starts with `high_risk:` → notify for manual review

Set `MAKE_COM_FRAUD_WEBHOOK` in `.env` after creating the scenario.

### Setup

```bash
# Apply migration
supabase db push   # or run supabase/migrations/20240617000000_fraud_prevention.sql

# Review flags (service role / Supabase dashboard)
select * from fraud_flags where reason like 'high_risk:%' order by created_at desc;
```

Checkpoint: [`.agents/checkpoints/fraud-prevention.json`](.agents/checkpoints/fraud-prevention.json)

Built as a lean one-man shop using Antigravity 2.0 + Grok.