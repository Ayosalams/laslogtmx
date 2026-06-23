# Hybrid AI Development Workflow
# laslogTMX Hybrid AI Stack (Antigravity Primary)
Version: 2026-06-22

> **SAFETY CHECK REQUIRED**: At the start of every major task, read and follow `skills/safetySKILL.md` in full. State "SAFETY CHECK PASSED" before making changes. Never hardcode secrets. Limit blast radius. All AI interactions must avoid exposing project secrets (use `.env.example` only, user env vars for MCP/tokens).

**Goal**: Maximize productivity for laslogTMX (one-man shop) while keeping **Antigravity as the primary build environment** for context-aware, integrated development. Use complementary tools for specific strengths without fragmenting workflow.

## Primary Environment
- **Antigravity IDE** (Gemini-powered agentic IDE/CLI) + **Grok Build delegate** (via MCP)
  - IDE for editing, navigation, full project awareness.
  - MCP integrations: GitHub, Supabase, Grok Build bridge.
  - Run: Open Antigravity on the laslogtmx workspace.
  - Delegate fast terminal/refactor tasks to Grok Build inside Antigravity.
  - Always restart Antigravity after MCP config changes (see `infra/mcp/apply-mcp-config.ps1` + `verify-mcp.ps1`).

**Why primary**: Deep project context, existing MCP setup, Gemini speed + Grok reasoning combination, native Git/Supabase awareness.

## When to Use Each Tool (Guidelines)

| Tool                  | Best For                                      | Limitations / Avoid When                     | Access Model                  |
|-----------------------|-----------------------------------------------|----------------------------------------------|-------------------------------|
| **Antigravity + Grok Build (MCP)** | Day-to-day coding, refactors, full context edits, Supabase queries, Git ops, checkpointing | Heavy local inference, fully offline work   | Gemini (primary) + Grok via delegate |
| **Grok Build CLI** (standalone `grok` or `grok.exe`) | Quick terminal tasks, batch scripts, non-IDE debugging, plan reviews | Lacks full IDE live editing context         | Grok models + OpenAI compat   |
| **Ollama + GLM-5.2**  | Privacy-sensitive code, offline work, cost-free long sessions, experimentation | Hardware heavy (GLM-5.2 full size needs high RAM; use quants). Slower on consumer GPU | Local GLM-5.2 (or glm-5) via Ollama / llama.cpp |
| **Gemini (direct / Antigravity / Google AI Studio)** | Fast UI generation, long context analysis, Google ecosystem tasks | Quotas on free tiers; less "brutal honesty" than Grok | Gemini 3.x family             |
| **OpenRouter**        | Cost-optimized access to many models (Claude, Grok, Gemini, Llama, etc.), A/B testing models, specific strengths | Adds latency; pay-per-use; manage keys      | 100+ models via unified API   |
| **Genspark**          | High-level ideation, UI mockups/prototypes, research, throwaway full-app scaffolds, AI Developer mode | Not for editing existing laslogTMX repo directly; generated code often needs heavy cleanup | Proprietary (Claude/GPT/etc.) |
| **OpenCode**          | Fully open-source agentic coding (terminal/IDE/desktop), model-agnostic (pair with Ollama/OpenRouter), LSP support | Newer tool; setup per-project agents; context management | Any (Ollama, OpenRouter, local servers) |

**Core Rule**: Default to Antigravity/Grok Build. Switch only for clear advantage (privacy, cost, unique model strength, or quick throwaway).

## Ollama + GLM-5.2 Setup (Local)

1. Download & install Ollama: https://ollama.com/download (Windows installer).
2. Open PowerShell and start service: `ollama serve` (or let desktop app run).
3. Pull GLM-5 series model:
   ```powershell
   # Recommended starting point (check library for exact GLM-5.2 tag)
   ollama pull glm-5
   # Or try direct 5.2 if tagged
   ollama pull glm-5.2
   # For lighter local use on modest hardware, consider smaller quant tags or fallback models
   ollama list
   ```
4. Run interactively:
   ```powershell
   ollama run glm-5
   ```
5. For coding use with agents:
   - Expose via Ollama API at `http://localhost:11434`
   - Configure other tools (OpenCode, Continue.dev if used, custom scripts) with base URL `http://localhost:11434` and model `glm-5` (or exact tag).
6. Hardware notes (per 2026 community):
   - GLM-5.2 is a large model (~744B total params in some variants). Full precision impossible on consumer. Use GGUF quants (Unsloth / llama.cpp) for local:
     - 4-bit / Q4: often requires 24GB+ unified RAM/VRAM for usable speed.
     - Lower quants (2-3 bit) possible on high-RAM Macs or multi-GPU; accuracy tradeoffs apply.
   - For 12GB VRAM laptops: expect Q4_K_M or smaller dense models. Use for specific tasks or pair with `ollama run` lighter models like qwen2.5-coder:7b as daily driver.
7. Privacy benefit: 100% local, no data leaves machine. Ideal for proprietary TMS logic.

**Quick local test**:
```powershell
ollama run glm-5 "Explain the RLS policy pattern used in laslogTMX Supabase migrations (do not output real SQL keys)"
```

## OpenCode Integration Guidance

OpenCode (https://opencode.ai/) is the open-source AI coding agent (terminal + desktop + IDE support, LSP-aware).

1. Install:
   - Desktop beta: Download from opencode.ai (Windows supported).
   - Or CLI: follow docs (often `npm i -g opencode` or direct binary).
2. Configure models (per-project or global):
   - Use Ollama: point at `http://localhost:11434` + model `glm-5`.
   - Use OpenRouter: add OpenRouter API key + base `https://openrouter.ai/api/v1`.
   - Example init in project (run `opencode init` or edit config):
     ```json
     {
       "model": "openrouter/auto",
       "baseURL": "https://openrouter.ai/api/v1",
       "apiKey": "YOUR_OPENROUTER_KEY_HERE"   // store outside repo
     }
     ```
3. Usage patterns for laslogTMX:
   - `opencode` in terminal for agentic edits similar to Grok Build.
   - Pair with Antigravity by running side-by-side (OpenCode for open model experiments).
   - Leverage LSP for accurate TS/TSX/React Native refactors.
4. Best with: Local Ollama for privacy, OpenRouter for variety.
5. Keep Antigravity primary: use OpenCode for secondary sessions or when wanting fully OSS harness.

## Quick-Switch Commands & Aliases (PowerShell)

Add to your PowerShell `$PROFILE` (run `notepad $PROFILE` then paste):

```powershell
# laslogTMX Hybrid AI Quick Switches
function laslog-prime {
    Write-Host "Switching to PRIMARY: Antigravity + Grok Build" -ForegroundColor Cyan
    cd "C:\Users\Ayoni\OneDrive\Desktop\Antigravity\laslogtmx"
    # Launch Antigravity if CLI available, or remind
    if (Get-Command antigravity -ErrorAction SilentlyContinue) { antigravity . } 
    else { Write-Host "Open Antigravity IDE manually on this folder. Then run infra\mcp\verify-mcp.ps1" -ForegroundColor Yellow }
}

function laslog-grok {
    Write-Host "Using Grok Build CLI..." -ForegroundColor Green
    cd "C:\Users\Ayoni\OneDrive\Desktop\Antigravity\laslogtmx"
    & "$env:USERPROFILE\.grok\bin\grok.exe" @args   # adjust if different entrypoint
}

function laslog-ollama {
    Write-Host "Starting Ollama + GLM-5 session (local/privacy)" -ForegroundColor Magenta
    cd "C:\Users\Ayoni\OneDrive\Desktop\Antigravity\laslogtmx"
    ollama run glm-5
}

function laslog-opencode {
    Write-Host "Launching OpenCode (configure Ollama/OpenRouter in it)" -ForegroundColor Blue
    cd "C:\Users\Ayoni\OneDrive\Desktop\Antigravity\laslogtmx"
    opencode   # or opencode.exe / npx opencode
}

function laslog-genspark {
    Write-Host "Opening Genspark AI Developer for ideation (browser)" -ForegroundColor DarkYellow
    Start-Process "https://www.genspark.ai/agents?type=ai_developer"
}

function laslog-openrouter {
    Write-Host "OpenRouter tips: Use in OpenCode / custom clients. Key via https://openrouter.ai/keys" -ForegroundColor White
    # Example curl placeholder only - never commit real key
}

# Usage examples:
# laslog-prime
# laslog-grok "refactor the load board card component"
# laslog-ollama
```

After editing `$PROFILE`, reload: `. $PROFILE`

Project-specific shortcuts (run from repo root):
- Primary MCP verify: `.\infra\mcp\verify-mcp.ps1`
- Apply MCP after key changes: `.\infra\mcp\apply-mcp-config.ps1`

## Workflow Summary

1. SAFETY CHECK (safetySKILL.md) → read hybrid-ai-workflowSKILL.md
2. Open Antigravity on laslogtmx workspace (primary)
3. Use Grok Build delegate inside for speed
4. For privacy/offline/long-running: switch to Ollama GLM-5.2 + OpenCode
5. Ideation / rapid non-repo prototypes: Genspark
6. Cost / model variety: OpenRouter + OpenCode or Grok Build
7. Create checkpoint in `.agents/checkpoints/` after major agent sessions
8. Update `laslogtmx-agents.json` when evolving the hybrid setup

**Always keep Antigravity as the single source of truth for active development state.**

## Related Files
- `infra/mcp/` (apply + verify + bridges)
- `.agents/laslogtmx-agents.json`
- `README.md`
- `skills/safetySKILL.md`, `webbuildSKILL.md`, `mobileSKILL.md`

Update this skill when adding new tools or changing defaults. Version the file on changes.
