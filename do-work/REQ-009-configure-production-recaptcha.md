---
id: REQ-009
title: Configure production reCAPTCHA
status: pending
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
