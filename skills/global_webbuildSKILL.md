# Global Web Build Skills
# Global Best Practices for laslogTMX
Version: 2026-06-21

> **SAFETY CHECK REQUIRED**: At the start of every major task, read and follow `skills/safetySKILL.md` in full. State "SAFETY CHECK PASSED" before making changes. Never hardcode secrets. Limit blast radius.

**One-Man Shop Rules**:
- Prioritize foundation (auth, RLS, navigation) before features
- Use shared package aggressively
- Military Time everywhere
- Company_id isolation is sacred
- Make.com for Phase 1 integrations (cost effective)
- Checkpoint system in .agents/checkpoints/

**Performance**:
- Cloudflare caching rules (see `infra/cloudflare/rules-manifest.json`)
- Supabase RLS + indexes
- Minimal dependencies

**Domains & Environments**:
- Production: laslogtmx.com + app.laslogtmx.com
- Staging: dev.laslogtmx.com (Cloudflare Pages `dev` branch)
- Legacy: laslogs.cc redirects only — fully migrated to laslogtmx.com
- Shared constants: `packages/shared/src/constants/index.ts` (`DOMAINS`, `APP_CONFIG`)

**Future-Proofing**:
- Scalable schema
- Environment separation (prod/dev)
- Easy white-label path