# Web Build Skills
# laslogTMX Web Build Guidelines
Version: 2026-06-27

> **SAFETY CHECK REQUIRED**: At the start of every major task, read and follow `skills/safetySKILL.md` in full. State "SAFETY CHECK PASSED" before making changes. Never hardcode secrets. Limit blast radius.

**Stack**: Next.js 15 + Tailwind + Cloudflare Pages (OpenNext adapter for web app)
**Domains**:
- laslogtmx.com → Marketing (separate CF Pages project)
- app.laslogtmx.com → Main Application (separate CF Pages project)
- dev.laslogtmx.com → Staging/Demo (`laslogtmx-dev` project on `develop` branch)
- laslogs.cc (legacy) → 301 redirect to laslogtmx.com — never reference in new code

**Cloudflare Multi-Project Setup**:
- Marketing (laslogtmx.com): CF project `laslogtmx-marketing`, Root dir = `apps/marketing`, Production branch = `main`
- Web app (app.laslogtmx.com): CF project `laslogtmx-app`, Root dir = `apps/web` (or `/` with `npm run build:web`), Production branch = `main`
- Staging (dev.laslogtmx.com): CF project `laslogtmx-dev`, Root dir = `/`, Production branch = `develop`

**Wrangler configs** (source of truth for OpenNext/Pages):
- Marketing: `apps/marketing/wrangler.jsonc` — static export, `pages_build_output_dir: ./out`
- Web: `apps/web/wrangler.jsonc` — OpenNext output, `main: .open-next/worker.js`, `nodejs_compat`, per-env names `laslogtmx-app` (prod) / `laslogtmx-dev` (preview)

**Cloudflare** (see `infra/cloudflare/rules-manifest.json`):
- HSTS preload via `apps/web/public/_headers`
- WAF + Page Shield enabled at zone level
- Redirect Rules: all laslogs.cc hosts → laslogtmx.com equivalents
- Cache Rules: bypass `/api/` and `/auth/`; cache `/logos/` and `/_next/static/`
- Rate limits on signup-risk, push webhook, and auth paths
- Use `CF-Connecting-IP` header for client IP (see signup-risk route)

**Build scripts (root)**:
- Marketing: `npm run build:marketing` (or turbo filter)
- Web: `npm run build:web`

## laslogtmx-dev Staging Setup

| Setting | Value |
|---------|-------|
| CF Project | `laslogtmx-dev` |
| Git branch | `develop` |
| Root directory | `/` |
| Build command | `npm run build:web` |
| Build output | `apps/web/.open-next/assets` |
| Node.js | `20` |
| Custom domain | `dev.laslogtmx.com` |

**Env vars**: Copy from `infra/staging/laslogtmx-dev.env.example` into CF dashboard. Use staging Supabase project + Stripe test keys. See `.env.example` for production vs staging sections.

**Seed data**: Run `supabase/seed.staging.sql` on the staging Supabase project only (5 test companies, operational + internal board loads).

**Local staging dev**: `cp infra/staging/laslogtmx-dev.env.example .env.local` → fill keys → `npm run dev:web`

**Key Rules**:
- Use shared package for components/hooks
- Light theme default
- Military time everywhere
- Strong RLS + company_id isolation
- Auth + Profile flow required
- Clean, fast, professional UI

**Features to Implement**:
- Auth pages
- Chat (Company + Load)
- MOTUS Helper
- Receipt OCR
- Compliance Hub