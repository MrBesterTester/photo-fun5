# Claude Code Instructions for photo-fun5

## Dylan Davis 50+ Methodology

This project follows the **Dylan Davis 50+ method** with three core documents:
- `docs/SPECIFICATION.md` - What we're building
- `docs/BLUEPRINT.md` - How to build it (step-by-step)
- `docs/TODO.md` - Roadmap with checkboxes

## Document Sets

The project supports multiple document sets using a prefix convention:
- **Default**: `docs/SPECIFICATION.md`, `docs/BLUEPRINT.md`, `docs/TODO.md`
- **Prefixed**: `docs/{prefix}-SPECIFICATION.md`, `docs/{prefix}-BLUEPRINT.md`, `docs/{prefix}-TODO.md`
- **Current prefixed set**: `SECURITY-` → `docs/SECURITY-SPECIFICATION.md`, `docs/SECURITY-BLUEPRINT.md`, `docs/SECURITY-TODO.md`

## When User Says "Continue" or "Continue with Step X.Y"

**REQUIRED**: Before implementing any step, read all three documents:
1. Read `docs/SPECIFICATION.md` for requirements context (or `docs/{prefix}-SPECIFICATION.md`)
2. Read `docs/BLUEPRINT.md` for implementation guidance (or `docs/{prefix}-BLUEPRINT.md`)
3. Read `docs/TODO.md` to find the specific step and its checklist items (or `docs/{prefix}-TODO.md`)

Then:
1. Find the step in TODO.md
2. Implement each checklist item
3. Run tests as specified
4. Check off completed items in TODO.md

## Dual Workflow: do-work + Dylan Davis

This project uses the **do-work** skill for autonomous execution, bridged from the Dylan Davis methodology.

### Planned Work (spec -> blueprint -> todo -> queue -> autonomous)
1. Create docs: `/create-spec` -> `/create-blueprint` -> `/create-todo`
2. Ingest into queue: `/ingest-todo` (converts TODO steps into do-work REQ files)
3. Process autonomously: `do work run` (processes the queue)
4. After completion: check off completed TODO items using `source_step` frontmatter from archived REQs

### Ad-hoc Work (direct to queue)
For bugs, ideas, or features outside any TODO cycle:
- `do work fix the header overflow`
- `do work add dark mode toggle`

### Manual Fallback (human-in-the-loop)
For steps needing visual testing, debugging, or human judgment:
- `start step X.Y` or `start step X.Y {prefix}`
- `continue step X.Y` or `continue step X.Y {prefix}`

### Git Integration
- do-work commits locally per REQ (granular history on working branch)
- Push directly to remote after gitleaks scan passes (no squashing)

## Model Preferences (from TODO.md)

Remind the user which model is recommended for the current step:
- **Frontend/UI work**: Claude Opus 4.5
- **Backend/logic**: GPT-5.2 or Opus 4.5
- **Debugging/visual/E2E tests**: Gemini 3 Pro
- **Quick fixes**: Sonnet 4

## Tech Stack

- **Framework**: Vite + React 19 + TypeScript
- **Styling**: Tailwind CSS (CDN)
- **AI**: Google Gemini API (`@google/genai`)
- **Backend**: Firebase (client-side SDK) + Vercel serverless functions (`api/`)
- **Build output**: `dist/`
- **Dev server**: `npm run dev` (Vite on port 3000)

## Testing Conventions

- **Type checking**: `npx tsc --noEmit`
- **Build validation**: `npm run build`
- **No unit test framework** — TypeScript type-check is the primary gate
- **Always validate results**: After completing any action, verify with `npx tsc --noEmit` and `npm run build`

## Key Project Rules

1. **Type safety**: Strict TypeScript, no `any`
2. **Security**: Never commit secrets; validate at API boundaries
3. **Incremental delivery**: Small PR-sized changes
4. **Avoid Gemini Pro 3 for file edits**: It may overwrite files with minimal content
5. **Always validate results**: After completing any action, verify with some form of testing (Boris Cherny)

## Browser Automation

- **Playwright MCP server** (`--browser chrome`): Use for test automation, generally in headless mode
- **Claude in Chrome extension**: Use for UI debugging, visual inspection, and making code changes
- **Chrome vs Chromium**: These are different browsers. Never confuse the two.

### Chrome MCP Session Checklist (MANDATORY)

Tab groups go stale across sessions and will silently break everything. Follow this checklist at the START of every browser automation session — no exceptions.

1. **Verify the Chrome extension is logged in.** Puzzle piece icon → Claude extension → confirm login. If not logged in, nothing works and errors will be cryptic.
2. **Start a fresh Claude Code session** if Chrome was restarted since last use. Old MCP connections do not survive Chrome restarts.
3. **Call `tabs_context_mcp` first.** Always. Before any other browser tool. This confirms the connection is alive and shows what tabs exist.
4. **Create new tabs with `tabs_create_mcp`.** Never reuse tab IDs from a previous session — they point to dead or invisible tabs.
5. **Look for the colored "Claude" label** in Chrome's tab bar. If you see a white square instead, the tab group is stale/collapsed and you're working blind.

### Chrome MCP Gotchas

- **"No tab available" errors**: The extension lost connection. Re-run `tabs_context_mcp`. If that fails, the user needs to check the extension login and you may need `/reconnect-chrome`.
- **"Frame with ID 0 is showing error page"**: The page didn't load. Common causes: wrong URL (e.g. `www.` prefix that doesn't resolve), DNS failure, Vercel Deployment Protection challenge. Check the actual URL — try without `www.` prefix.
- **CDP timeout (45s limit)**: JavaScript execution via `javascript_tool` times out after 45 seconds. For long-running operations (e.g. multiple API calls with delays), store results in `window.__variableName` and return immediately, then read the variable in a separate call.
- **Console messages**: `read_console_messages` can be flaky. Prefer storing results in `window.*` variables and reading them with `javascript_tool` over relying on console log capture.
- **reCAPTCHA**: Claude cannot click "I'm not a robot" checkboxes — bot detection rules prohibit it. The user must handle CAPTCHA interactions manually.
- **Vercel WAF rate limiting**: Rapid-fire requests to Vercel-hosted endpoints (even from the browser) will trigger Vercel's built-in WAF/DDoS protection (HTTP 429 with `sfo1::` IDs in the response body). This is NOT your application's rate limiter. The WAF blocklist can persist for 10+ minutes. Use delays between requests (15s+ for safety) and do not burst.
- **Vercel Attack Challenge Mode**: After triggering WAF rate limits, Vercel may escalate to a full Security Checkpoint that requires JavaScript execution to pass. `curl` cannot pass this challenge. Use browser-based `fetch()` via `javascript_tool` instead, or wait hours for the blocklist to expire.

## Git Workflow

- Push directly to `main` — no squash, no intermediate branches
- Run `gitleaks detect --source .` before pushing to catch secrets
- CI runs gitleaks + CodeQL on every push as a second gate
- **`.gitleaks.toml` allowlist**: reCAPTCHA site keys (public by design) are allowlisted by commit hash. Format: `commits = ["sha1", "sha2"]` (simple string array, NOT TOML table arrays)
- For one-time history scrubs (e.g., removing a leaked secret retroactively), use `git-filter-repo`

## Vercel Deployment Lessons

1. **Strip trailing `\n` from all Vercel env vars** — causes auth failures
2. **Function timeout: 60s** for LLM API calls in `vercel.json`
3. **Gate production deploys behind CI** — `ignoreCommand` in `vercel.json`
4. **Health check via `vercel inspect`** — not curl (blocked by Deployment Protection on `.vercel.app`)
5. **Use project alias URL** for testing, not deployment-specific hash URLs
6. **WAF rules are dashboard-only** — not configurable in `vercel.json`
7. **Env var JSON encoding** — compact single-line JSON for credentials with newlines
8. **GitHub secrets for CI deploy**: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` — set via `gh secret set`
9. **Vercel tokens**: Must be created via dashboard (https://vercel.com/account/tokens), no CLI command
10. **Re-run failed CI jobs**: `gh run rerun <run-id> --failed`
11. **Project ID source of truth**: `.vercel/project.json` (org: `team_lAFd8eLgRO9IuivB7YwxiO3m`, project: `prj_9zF49tq1xRn9XGgXizo1DLUibgeE`)
