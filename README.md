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

## Cloudflare Deployment (Multi-Project)

**Two separate Cloudflare Pages projects** (monorepo with Turborepo):

| Site | CF Project | Root Directory | Production Branch | Purpose |
|------|------------|----------------|-------------------|---------|
| laslogtmx.com | `laslogtmx-marketing` | `apps/marketing` | `main` | Marketing / landing |
| app.laslogtmx.com | `laslogtmx-web` | `apps/web` | `main` | Full TMS web application |
| dev.laslogtmx.com | (see staging) | (see below) | `develop` | Staging / preview |

Security and routing (zone-level) remain in `infra/cloudflare/rules-manifest.json`. Marketing site uses static export; web app uses full Next.js build output.

Pages configs:
- Marketing: `apps/marketing/wrangler.toml`
- Web: `apps/web/wrangler.toml`

### Exact Cloudflare Pages Dashboard Steps to Create Projects

1. Dashboard → **Pages** → **Create a project** → **Connect to Git** → select the `laslogtmx` repo.

**Create Marketing project (laslogtmx.com):**
- Project name: `laslogtmx-marketing`
- **Production branch**: `main`
- **Root directory**: `apps/marketing`
- **Build command**: `npm run build:marketing`
- **Build output directory**: `out`
- Framework preset: **Next.js** (or None if using pure static)
- Click **Save and Deploy**
- After success: Settings → Custom domains → Add domain `laslogtmx.com` (add `www.laslogtmx.com` too if using)
- (Optional) Add env vars if marketing-specific vars required

**Create / Update Web App project (app.laslogtmx.com):**
- Project name: `laslogtmx-web`
- **Production branch**: `main`
- **Root directory**: `apps/web`
- **Build command**: `npm run build:web`
- **Build output directory**: `.vercel/output/static` (match previous adapter config)
- Deploy
- Custom domains → Add `app.laslogtmx.com`

**Add env vars (per project in CF dashboard):**
- In each project: Settings → Environment variables (production + preview)
- Add the Supabase + other `NEXT_PUBLIC_*` (see `.env.example`). Do NOT commit real keys.

### Staging (dev.laslogtmx.com) on `develop` branch

1. Create and push a `develop` branch.
2. In **both** CF Pages projects:
   - Go to the project → **Deployments** tab or Settings → Build & deployments → configure `develop` branch builds.
   - Add custom domain `dev.laslogtmx.com` (may attach to preview deployment; for full custom often use a dedicated staging Pages project pointing to develop branch).
3. Set **branch environment variables** (or preview) for both projects:
   - `NEXT_PUBLIC_APP_URL=https://dev.laslogtmx.com`
   - `NEXT_PUBLIC_WEB_APP_URL=https://dev.laslogtmx.com`
   - `NEXT_PUBLIC_MARKETING_URL=https://dev.laslogtmx.com`
4. Deploy from `develop`; add `dev.laslogtmx.com` (and `*.dev.laslogtmx.com` if needed) to Supabase Authentication → URL Configuration → Redirect URLs.

**Local dev**:
- `npm run dev:marketing`
- `npm run dev:web`

Checkpoint: [`.agents/checkpoints/cloudflare-setup.json`](.agents/checkpoints/cloudflare-setup.json) | [`.agents/checkpoints/cloudflare-pages-structure.json`](.agents/checkpoints/cloudflare-pages-structure.json)

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

## Production Readiness: Monitoring + Hardening (Top 3)

Implemented (lightweight for one-man shop):

1. **Sentry Error Monitoring + client tracking (web + mobile)**
   - `@sentry/nextjs` + `@sentry/react-native`
   - Shared `captureException` + `initSentry` (packages/shared/src/utils/errorLogger.ts)
   - Auto global error + promise rejection handlers on web
   - Best-effort Supabase "unified_logs" table writes for unified visibility (create table if desired)

2. **Proper Auth Gating on all web routes (Next.js Middleware)**
   - `apps/web/middleware.ts` redirects unauthenticated visitors (no session marker cookie) from protected routes → `/auth/login`
   - Protected: `/load-board*`, `/chat*`, `/admin*`, `/settings*`, `/receipts*`, `/expenses*`, `/motus*`
   - Works with existing client AuthProvider + lightweight `laslogtmx-auth` cookie set on login
   - Server RLS + client `useAuth` remain primary security

3. **App-level Rate Limiting on Load Board (post + bid)**
   - Uses Upstash Redis via `@upstash/ratelimit` when configured (5/min default)
   - Graceful fallback to in-memory (dev)
   - Enforced in `useLoadBoard.postLoad` and `useBidding.submitBid`
   - Keys per company; capture errors to Sentry

### Setup Instructions (Monitoring)

1. Copy `.env.example` → `.env.local`
2. Sentry:
   - Sign up at sentry.io (free tier)
   - Create project (Next.js + React Native)
   - Paste `NEXT_PUBLIC_SENTRY_DSN=...` (public client key)
3. Upstash (rate limiting):
   - console.upstash.com → Create Redis DB (free)
   - Copy REST URL + TOKEN → `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
4. (Optional) Unified Logs:
   - In Supabase SQL: `CREATE TABLE IF NOT EXISTS public.unified_logs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), level text, message text, meta jsonb, created_at timestamptz DEFAULT now());` + enable RLS if needed for service role only.
5. Rebuild after `npm install`
6. Admin → new top monitoring quick links to dashboards

Update your Supabase Auth redirect URLs and Cloudflare if adding domains.

Checkpoint: [`.agents/checkpoints/production-hardening.json`](.agents/checkpoints/production-hardening.json)

Built as a lean one-man shop using Antigravity (primary) + Grok + hybrid AI stack (Ollama, OpenCode, OpenRouter, Genspark).

## Hybrid AI Development Workflow

**Primary build environment**: Antigravity IDE (Gemini-powered) with Grok Build MCP delegate. Use for all active laslogTMX development to retain full project context + MCP (GitHub + Supabase).

See the full recommended hybrid stack, usage guidelines, setup instructions, and quick-switch aliases in:
- [skills/hybrid-ai-workflowSKILL.md](skills/hybrid-ai-workflowSKILL.md)
- Required skill referenced from [.agents/laslogtmx-agents.json](.agents/laslogtmx-agents.json)

### Quick Reference (see SKILL.md for details + PowerShell profile aliases)
- **Default**: Open Antigravity on workspace → use Grok Build delegate inside.
- **Local/privacy**: `ollama run glm-5` (after Ollama install) + pair with OpenCode.
- **Ideation/prototypes**: Genspark AI Developer.
- **Model variety**: OpenRouter (configure in OpenCode / Grok Build).
- **Verify MCP**: `.\infra\mcp\verify-mcp.ps1`

**Core guideline**: Default to Antigravity/Grok. Switch only when privacy, cost, offline, or unique capability is required. Always run SAFETY CHECK first.