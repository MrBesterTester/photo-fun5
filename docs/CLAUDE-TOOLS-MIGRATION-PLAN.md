# Plan: Refresh Claude Tools in photo-fun5 from samkirk-v3

## Table of Contents

- [Context](#context)
- [Step 0: Clean up obsolete docs](#step-0-clean-up-obsolete-docs)
- [Step 1: Methodology docs](#step-1-methodology-docs-copy-as-is-from-samkirk-v3)
- [Step 2: Root config files](#step-2-root-config-files)
- [Step 3: `.claude/` support files](#step-3-claude-support-files)
- [Step 4: `.claude/commands/`](#step-4-claudecommands-7-commands-adapted-for-photo-fun5)
- [Step 5: `.claude/skills/`](#step-5-claudeskills-5-core-dylan-davis-skills)
- [Step 6: do-work skill + bridge skills](#step-6-do-work-skill--bridge-skills)
- [Key Adaptations](#key-adaptations)
- [Vercel Deployment Lessons](#vercel-deployment-lessons-embedded-in-claudemd)
- [Verification](#verification)

---

## Context

photo-fun5 currently has minimal Claude tooling (just `.claude/settings.local.json` with `Bash(find:*)` permission). samkirk-v3 has a full Claude Code setup: CLAUDE.md, 7 commands, 5+ skills, Vercel MCP, do-work autonomous skill, methodology docs, and extensive Vercel deployment lessons learned. This plan migrates and adapts all of that to photo-fun5, and cleans up obsolete docs.

**Key tech stack differences:**

| | samkirk-v3 | photo-fun5 |
|---|---|---|
| Framework | Next.js 16 (in `web/` subdir) | Vite + React 19 (root-level) |
| AI Service | GCP Vertex AI | Google Gemini API (`@google/genai`) |
| Database | Firestore (server-side) | Firebase (client-side SDK) |
| Testing | Vitest + Playwright | TypeScript type-check only (`npx tsc --noEmit`) |
| Build output | `.next/` | `dist/` |
| Dev server | `cd web && npm run dev` | `npm run dev` (Vite) |
| Vercel project ID | `prj_w6WtTr0Ae61aE2cW0GTEHaffs3kx` | `prj_kNAdQnJ5wgbRyxpRQd4dUx6twJKx` |
| Vercel team ID | `team_lAFd8eLgRO9IuivB7YwxiO3m` | `team_lAFd8eLgRO9IuivB7YwxiO3m` (same) |
| Custom domain | samkirk.com | photo-fun.samkirk.com |

---

## Step 0: Clean up obsolete docs

**Remove** these files from `docs/`:
- `docs/CI_CD.md` — superseded by CLAUDE.md + ship/watch-deploy commands
- `docs/implement_option_b_secure_serverless_api_route.md` — already implemented, stale planning doc
- `docs/start_vercel-deployment-steps.md` — superseded by login-vercel + restart-dev-server commands
- `docs/TRUEFOUNDRY_SETUP.md` — unused integration
- `docs/TRUEFOUNDRY_TEST_PLAN.md` — unused integration

**Keep:**
- `docs/Prompts.md` — app-specific photo editing prompt templates
- `docs/cost-security_gcp-vercel.md` — Vercel WAF, rate limits, budget alerts specific to photo-fun5

---

## Step 1: Methodology docs (copy as-is from samkirk-v3)
- `docs/Dylan-Davis-50plus-method.md` — verbatim copy (~1265 lines)
- `docs/Matts-integration-with-Dylan-plan-samkirk-v3.md` — verbatim copy (~200 lines)

---

## Step 2: Root config files
- **`CLAUDE.md`** — New. Adapted from samkirk-v3 for photo-fun5's stack. Includes Vercel deployment lessons learned.
- **`.mcp.json`** — New. `{"mcpServers":{"vercel":{"type":"http","url":"https://mcp.vercel.com"}}}`
- **`.claudeignore`** — New. Exclude `REFERENCES/` from Claude context.
- **`vercel.json`** — New. Gate deploys to `main` + function timeout 60s for `api/**/*.ts`.

---

## Step 3: `.claude/` support files
- **`.claude/README.md`** — Directory structure and usage guide (adapted)
- **`.claude/QUICKSTART.md`** — Getting started with Vite commands
- **`.claude/RULES.md`** — Project conventions for photo-fun5 stack
- **`.claude/CURSOR-COMPATIBILITY.md`** — Command mapping
- **`.claude/settings.local.json`** — Expanded permissions (git, npm, build, MCP tools, etc.)

---

## Step 4: `.claude/commands/` (7 commands, adapted for photo-fun5)
- **`deploy-vercel.md`** — No `web/` prefix; health check on root URL
- **`login-gcloud.md`** — Simplified (keep for Firebase Admin / future GCP use)
- **`login-vercel.md`** — `.vercel/project.json` at root (no `web/` prefix)
- **`restart-dev-server.md`** — Vite: kill port 3000, `npm run dev` (no `.next` cache)
- **`ship.md`** — Pre-flight: `npx tsc --noEmit`; Vercel project ID: `prj_kNAdQnJ5wgbRyxpRQd4dUx6twJKx`
- **`watch-deploy.md`** — Same Vercel project ID adaptation
- **`reconnect-chrome.md`** — Unchanged (browser-specific, not project-specific)

---

## Step 5: `.claude/skills/` (5 core Dylan Davis skills)
- **`create-spec.md`** — Same (methodology-generic)
- **`create-blueprint.md`** — Same
- **`create-todo.md`** — Same
- **`start-step.md`** — Same (with doc-set prefix support)
- **`continue-step.md`** — Same

---

## Step 6: do-work skill + bridge skills
- **Install do-work:** `npx skills add bladnman/do-work` (creates `.agents/skills/do-work/` and symlink)
- **`.claude/skills/do-work-finish-then-stop/SKILL.md`** — Copy from samkirk-v3
- **`.claude/skills/ingest-todo/SKILL.md`** — Copy from samkirk-v3
- **`.claude/skills/sync-todo/SKILL.md`** — Copy from samkirk-v3

---

## Key Adaptations

### CLAUDE.md
- Stack: Vite + React 19 + TypeScript + Tailwind CSS (CDN) + Google Gemini API + Firebase
- Testing: `npx tsc --noEmit` for type checking, `npm run build` for build validation
- Dev server: `npm run dev` (Vite on port 3000)
- Build cache: `dist/` not `.next/`; no `web/` subdirectory
- Git workflow: push to `main`, gitleaks scan, CI gates deploy
- Vercel deployment lessons (trailing newlines, function timeouts, WAF, CI gating, health checks)

### ship.md / watch-deploy.md
- Pre-flight: `npx tsc --noEmit` instead of `npm run test:all`
- Vercel project ID: `prj_kNAdQnJ5wgbRyxpRQd4dUx6twJKx`, team: `team_lAFd8eLgRO9IuivB7YwxiO3m`
- Health check: `vercel inspect` for READY state (not curl — blocked by Deployment Protection)

### restart-dev-server.md
- Kill port 3000, `npm run dev` from root (no `.next` cache to clear)

### vercel.json (new)
```json
{
  "ignoreCommand": "if [ \"$VERCEL_GIT_COMMIT_REF\" = \"main\" ]; then exit 0; else exit 1; fi",
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

### settings.local.json
Expand from `Bash(find:*)` to full permission set: git commands, npm build/test/dev, MCP tools (Vercel, Chrome, Playwright), gcloud, vercel CLI, etc.

---

## Vercel Deployment Lessons (embedded in CLAUDE.md)

1. **Strip trailing `\n` from all Vercel env vars** — causes auth failures
2. **Function timeout: 60s** for LLM API calls in `vercel.json`
3. **Gate production deploys behind CI** — `ignoreCommand` in `vercel.json`
4. **Health check via `vercel inspect`** — not curl (blocked by Deployment Protection on `.vercel.app`)
5. **Use project alias URL** for testing, not deployment-specific hash URLs
6. **WAF rules are dashboard-only** — not configurable in `vercel.json`
7. **Env var JSON encoding** — compact single-line JSON for credentials with newlines

---

## Verification

1. Confirm all new files exist with correct content
2. `npx tsc --noEmit` — still passes (no code changes)
3. `npm run build` — still passes
4. `.mcp.json` and `vercel.json` are valid JSON
5. No samkirk-v3 specific references remain (project IDs, domain names, `web/` paths)
6. Obsolete docs removed; `Prompts.md` and `cost-security_gcp-vercel.md` preserved
