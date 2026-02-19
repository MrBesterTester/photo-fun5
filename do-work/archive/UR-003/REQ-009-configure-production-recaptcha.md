---
id: REQ-009
title: Configure production reCAPTCHA
status: completed
claimed_at: 2026-02-19T19:00:00Z
route: A
completed_at: 2026-02-19T19:30:00Z
created_at: 2026-02-19T18:00:00Z
user_request: UR-003
related: [REQ-004, REQ-012]
---

# Configure Production reCAPTCHA

## What
Replace the Google reCAPTCHA test key with a production key and add the production domain to the Google reCAPTCHA console allowlist.

## Context
Currently using Google's test key (as noted in SECURITY-comparison-report_2.md). Two steps:
1. Set `RECAPTCHA_SECRET_KEY` in Vercel env vars with the real production secret key
2. Add the production domain to the Google reCAPTCHA console allowlist

Must be done before REQ-012 (integration testing), since REQ-012 validates the full protection flow and reCAPTCHA degrades to pass-through when credentials are missing.

---
*Source: docs/SECURITY-comparison-report_2.md, Production Readiness Checklist items 1-2*

---

## Triage

**Route: A** - Simple

**Reasoning:** Clear config/ops task, but requires human action — production reCAPTCHA keys must be obtained from Google console and set in Vercel env vars. Cannot be automated.

**Planning:** Not required

## Plan

**Planning not required** - Route A: Direct implementation

Rationale: This is a manual ops task. The code already references `process.env.RECAPTCHA_SECRET_KEY` on the backend. The only code change needed is replacing the hardcoded test site key in `ChatInterface.tsx`.

*Skipped by work action*

## Implementation Summary

Completed with guided human-in-the-loop workflow:

1. **reCAPTCHA console** — Existing site (samkirk.com, v2 Checkbox) already had correct domain allowlist: `samkirk.com`, `localhost`, `samkirk-com-v3.vercel.app`, `vercel.app`
2. **Frontend site key** — Updated `components/ChatInterface.tsx:6` from Google test key to production site key
3. **Vercel secret key** — Set `RECAPTCHA_SECRET_KEY` via `vercel env add` across Production, Preview, Development environments
4. **Vercel project re-linked** — `vercel link --yes --scope sam-kirks-projects`

*Completed by work action (Route A) with human-in-the-loop*

## Testing

**Tests run:** `npx tsc --noEmit` — passes
**Result:** Code change verified. Full integration validation deferred to REQ-012.

*Verified by work action*
