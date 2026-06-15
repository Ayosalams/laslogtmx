# Global Web Build Skills
# Global Best Practices for laslogTMX
Version: 2026-06-13

**One-Man Shop Rules**:
- Prioritize foundation (auth, RLS, navigation) before features
- Use shared package aggressively
- Military Time everywhere
- Company_id isolation is sacred
- Make.com for Phase 1 integrations (cost effective)
- Checkpoint system in .agents/checkpoints/

**Performance**:
- Cloudflare caching rules
- Supabase RLS + indexes
- Minimal dependencies

**Future-Proofing**:
- Scalable schema
- Environment separation (prod/dev)
- Easy white-label path