---
name: delegation
description: >
  Handoff rules between Grok Build and Antigravity agents for laslogTMX.
  Use before delegating any task. Triggers: delegate, handoff, Antigravity,
  Gemini, Grok Build, MCP delegate, UI task, backend task, Make.com,
  Cloudflare deploy, cross-agent collaboration.
metadata:
  short-description: "Agent delegation — Grok Build ↔ Antigravity handoffs"
---

# Agent Delegation — Grok Build ↔ Antigravity

**Apply before every handoff.** Both agents must collaborate; neither works alone on shared tasks.

## Primary Environment

- **Antigravity IDE** (Gemini) — primary for editing, navigation, UI, full project context.
- **Grok Build** — backend, terminal, refactors, Supabase/GitHub MCP operations.
- **Bridge**: `grok-build` MCP delegate (`infra/mcp/apply-mcp-config.ps1`).

## Handoff Matrix

| Task | Owner | How |
|------|-------|-----|
| UI components, styling, layout | **Antigravity (Gemini)** | Work in IDE; return artifacts only |
| React/TSX refactors (visual) | **Antigravity** | Full IDE context |
| API routes, middleware, server logic | **Grok Build** | Direct or via MCP delegate |
| Supabase migrations / SQL | **Grok Build** | Supabase MCP — confirm before apply |
| GitHub PRs, issues, CI | **Grok Build** | GitHub MCP |
| Terminal scripts, batch ops | **Grok Build CLI** | `grok` from project root |
| Cloudflare deploy | **User confirms** → Grok or manual wrangler | No CF MCP |
| Make.com scenarios | **User + Antigravity** | No MCP — see below |
| Plan / architecture review | **Grok Build** | Return plan; Antigravity implements UI |

## Handoff Protocol

1. **State intent**: What task, which agent, expected deliverable.
2. **Run backup**: Invoke `backup-rollback` skill before any file changes.
3. **Confirm with user** before delegating across agents or calling external APIs/MCP.
4. **Pass context**: Include project root, affected files, constraints, and return format.
5. **Return artifacts only**: Delegated agent returns code/files — not full reasoning dumps.
6. **Verify**: Receiving agent reviews diff before merging into main workstream.

### Grok Build Delegate (from Antigravity)

```
Use grok-build MCP → delegate_task with:
- Project root: C:\Users\Ayoni\OneDrive\Desktop\Antigravity\laslogtmx
- Specific files and requirements
- "Respect military time, RLS, company_id isolation"
- "Run safety check and backup-rollback first"
```

Restart Antigravity after MCP config changes. Verify: `.\infra\mcp\verify-mcp.ps1`

## Make.com Integration (No MCP)

Make.com has **no dedicated MCP server**. Integrate via webhooks and blueprints.

### Blueprints (import manually)

| File | Purpose |
|------|---------|
| `integrations/make/external-load-match.json` | External load feed → match notifications |
| `integrations/make/signup-fraud-velocity.json` | Fraud velocity alerts |

Import into Make.com dashboard. Connect modules per blueprint `notes` field.

### Webhook Endpoints (configure secrets in Make + CF env vars)

| Route | Secret env var | Purpose |
|-------|----------------|---------|
| `apps/web/app/api/load-match/external/route.ts` | `LOAD_MATCH_WEBHOOK_SECRET` | External load match ingestion |
| `apps/web/app/api/push/send/route.ts` | `PUSH_WEBHOOK_SECRET` | Push notifications from Supabase/Make |

### Make.com Workflow Rules

1. **Never** paste webhook secrets into chat or commits — use Cloudflare env vars.
2. **Confirm with user** before creating or modifying Make scenarios.
3. **Test on staging** (`dev.laslogtmx.com`) before production webhooks.
4. Supabase can trigger Make via database webhooks → Make custom webhook module.
5. Document scenario changes in `.agents/checkpoints/` after major updates.

### Delegation for Make Tasks

- **Design scenario** → Antigravity (user reviews in Make.com UI).
- **Create/fix webhook route** → Grok Build.
- **DB function for match logic** → Grok Build (Supabase MCP, confirm before migration).

## Cloudflare (No MCP)

- Deploy via `npm run build:web` / `npm run build:marketing` + CF Pages.
- Config: `infra/cloudflare/rules-manifest.json`, `apps/*/wrangler.jsonc`.
- **Always confirm** with user before production deploy.

## GitHub + Supabase MCP

- GitHub: PRs, issues, workflow files — prefer MCP over raw `gh` when in Antigravity.
- Supabase: migrations, `execute_sql`, edge functions — **confirm before destructive ops**.
- Never expose tokens; use `${VAR}` in configs.

## Anti-Patterns

- Grok editing UI without Antigravity review.
- Antigravity running Supabase migrations without Grok/safety check.
- Either agent deploying without backup + user confirmation.
- Handing Make.com webhook secrets to any agent output.