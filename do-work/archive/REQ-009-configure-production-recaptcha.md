---
id: REQ-009
title: Configure production reCAPTCHA
status: failed
claimed_at: 2026-02-19T19:00:00Z
route: A
error: "Requires human action — production reCAPTCHA keys must be obtained from Google console, set in Vercel env vars, and frontend test key replaced"
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

**This REQ requires manual human action.** The following steps must be completed by the user:

### What's already in place
- Backend (`api/image-edit.ts:96`) already reads `process.env.RECAPTCHA_SECRET_KEY`
- Frontend (`components/ChatInterface.tsx:6`) has hardcoded Google test site key: `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`

### Steps for the user

1. **Google reCAPTCHA Console** — Go to https://www.google.com/recaptcha/admin and either create a new site or use an existing one:
   - Type: reCAPTCHA v3
   - Add your production domain(s) to the allowlist

2. **Get production keys** from the console:
   - **Site Key** (public, goes in frontend code)
   - **Secret Key** (private, goes in Vercel env var)

3. **Set Vercel env var:**
   ```
   vercel env add RECAPTCHA_SECRET_KEY production
   ```
   Paste the Secret Key (strip any trailing newline).

4. **Update frontend site key** in `components/ChatInterface.tsx:6`:
   Replace the test key with your production Site Key.

5. **Redeploy** to pick up the new env var.

*Completed by work action (Route A) — marked as failed because it requires human action*

## Testing

**Tests run:** N/A — manual configuration task
**Result:** Cannot be verified programmatically until keys are in place. REQ-012 (integration testing) will validate the full flow.

*Verified by work action*
