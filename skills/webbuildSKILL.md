# Web Build Skills
# laslogTMX Web Build Guidelines
Version: 2026-06-21

> **SAFETY CHECK REQUIRED**: At the start of every major task, read and follow `skills/safetySKILL.md` in full. State "SAFETY CHECK PASSED" before making changes. Never hardcode secrets. Limit blast radius.

**Stack**: Next.js 15 + Tailwind + Cloudflare Pages
**Domains**:
- laslogtmx.com → Marketing
- app.laslogtmx.com → Main Application
- dev.laslogtmx.com → Staging/Demo
- laslogs.cc (legacy) → 301 redirect to laslogtmx.com — never reference in new code

**Cloudflare** (see `infra/cloudflare/rules-manifest.json`):
- HSTS preload via `apps/web/public/_headers`
- WAF + Page Shield enabled at zone level
- Redirect Rules: all laslogs.cc hosts → laslogtmx.com equivalents
- Cache Rules: bypass `/api/` and `/auth/`; cache `/logos/` and `/_next/static/`
- Rate limits on signup-risk, push webhook, and auth paths
- Use `CF-Connecting-IP` header for client IP (see signup-risk route)

**Staging**: Cloudflare Pages `dev` branch → `dev.laslogtmx.com`. Override `NEXT_PUBLIC_*_URL` env vars on that branch.

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