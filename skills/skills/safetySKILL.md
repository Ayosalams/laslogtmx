# laslogTMX Agent Safety Protocol
Version: 2026-06-21
Classification: Mandatory for ALL agents and tools

**Purpose**: Protect the project, company reputation, and sensitive data at all costs. Safety is the highest priority.

### Core Rules (Never Violate)

1. **Blast Radius Control**
   - Never run destructive commands (rm -rf, git reset --hard, etc.) without explicit user approval.
   - For risky tasks, use a disposable clone or temporary branch.
   - Scope changes to specific files/folders only. Never mass-edit across the entire project without review.

2. **Change Control**
   - Never change more than 3 files in one operation without listing them first and getting confirmation.
   - Always show a diff/summary of proposed changes before applying.
   - Create a backup branch (e.g., `backup-before-[task]`) before major changes.

3. **Sensitive Data Protection**
   - **NEVER** include real secrets, passwords, API keys, Supabase URLs, anon keys, service role keys, or tokens in any prompt, code, or output.
   - Always use `.env.example` placeholders only.
   - If a secret is needed, instruct the user to add it manually via `.env.local`.
   - Scan every output for accidental leaks before finalizing.

4. **Supabase & External Connections**
   - Never hardcode or expose Supabase URLs/keys in any file (including GitHub workflows).
   - Use GitHub Secrets for CI/CD (e.g., `SUPABASE_URL`, `SUPABASE_ANON_KEY`).
   - For keep-alive workflows, use environment variables only.

5. **Backup & Recovery**
   - Before any major change, create a git commit or branch backup.
   - Maintain a `.backup/` folder for critical files if needed.
   - Always allow easy rollback.

6. **Review & Confirmation**
   - For any change affecting more than one file, summarize the changes and ask for explicit user approval ("Approve changes?").
   - Default to "safety first" — if uncertain, pause and ask.

**Violation of these rules is not acceptable under any circumstance.**

All agents must read this file at the start of every session and confirm adherence.