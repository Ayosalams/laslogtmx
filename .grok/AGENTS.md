# laslogTMX — Agent Boundaries (Antigravity Primary)

**Project root**: `C:\Users\Ayoni\OneDrive\Desktop\Antigravity\laslogtmx`
**Mirror**: `I:\Grok-Projects\laslogtmx` (sync target — not primary for active dev)

## Collaboration (Mandatory)

- **Grok Build** and **Antigravity** agents MUST collaborate — never work in isolation on the same task.
- **Antigravity** is the primary IDE (Gemini + full project context).
- **Grok Build** handles backend logic, terminal tasks, refactors, and MCP-driven operations via delegate.
- Use the `delegation` skill for every handoff between agents.
- Use the `backup-rollback` skill before ANY file change or deployment.

## Safety Gates

1. Run `skills/safetySKILL.md` safety check at the start of major tasks. State "SAFETY CHECK PASSED".
2. Follow `security-guardrails` skill (workspace + user scope).
3. **Before ANY file change or deployment**: create timestamped backup at `../Backups/laslogtmx_YYYYMMDD_HHMM/` (see `backup-rollback` skill).
4. Ask user permission before external API calls, MCP invocations, or deployments.

## Delegation Quick Reference

| Task type | Delegate to |
|-----------|---------------|
| UI / components / styling | Antigravity (Gemini) |
| Backend / API routes / DB | Grok Build |
| Terminal / batch / scripts | Grok Build CLI or delegate |
| Supabase migrations | Grok Build (confirm before apply) |
| GitHub PRs / issues | Grok Build via GitHub MCP |
| Make.com scenarios | User + Antigravity (no MCP — see delegation skill) |
| Cloudflare deploy | Confirm first — wrangler or CF dashboard |

## MCP Tools (Enabled)

Managed by `infra/mcp/apply-mcp-config.ps1`. Verify with `infra/mcp/verify-mcp.ps1`.

| Server | Use for |
|--------|---------|
| **github** | PRs, issues, repo operations |
| **supabase** | Migrations, SQL, branches, edge functions |
| **grok-build** | Delegate tasks to Grok Build from Antigravity |

**Cloudflare**: No dedicated MCP — use `wrangler.jsonc`, CF dashboard, and `infra/cloudflare/rules-manifest.json`.

**Make.com**: No MCP — use webhook blueprints in `integrations/make/` and API routes (see delegation skill).

## Cloudflare (Priority Platform)

| Domain | CF Pages Project | Root Dir |
|--------|-----------------|----------|
| laslogtmx.com | `laslogtmx-marketing` | `apps/marketing` |
| app.laslogtmx.com | `laslogtmx-web` | `apps/web` |
| dev.laslogtmx.com | both | `develop` branch |

- Zone rules: `infra/cloudflare/rules-manifest.json`
- Builds: `npm run build:marketing` / `npm run build:web`
- Secrets: Cloudflare Pages env vars — never hardcode

## Related Files

- `skills/hybrid-ai-workflowSKILL.md` — full hybrid stack guide
- `skills/safetySKILL.md` — mandatory safety protocol
- `.grok/skills/delegation/` — handoff rules
- `.grok/skills/backup-rollback/` — pre-change backup rules