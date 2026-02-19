# Security Hardening Specification: photo-fun5

**Source:** `docs/SECURITY-comparison-report.md` (audit benchmarked against samkirk-v3)
**Date:** 2026-02-19
**Goal:** Close the structural security gaps identified in the audit, bringing photo-fun5 toward parity with samkirk-v3's multi-layered protection stack.

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Scope](#scope)
- [Requirements](#requirements)
  - [R1: reCAPTCHA with Server-Side Verification](#r1-recaptcha-with-server-side-verification)
  - [R2: Server-Side Rate Limiting](#r2-server-side-rate-limiting)
  - [R3: Hard Spend Cap](#r3-hard-spend-cap)
  - [R4: Input Validation](#r4-input-validation)
  - [R5: Remove Debug Info Leak](#r5-remove-debug-info-leak)
  - [R6: Add gitleaks to CI](#r6-add-gitleaks-to-ci)
- [Out of Scope](#out-of-scope)
- [Success Criteria](#success-criteria)

---

## Problem Statement

photo-fun5 currently relies almost entirely on Vercel WAF and Gemini's own API tier limits for security. There is no application-level protection: no CAPTCHA, no server-side rate limiting, no hard spend cap, and minimal input validation. An attacker can programmatically hit `/api/image-edit` without proving they're human, and there is no mechanism to stop spending once GCP budget alerts fire.

## Scope

Implement the 6 primary recommendations from the security audit report. These close the structural gaps between photo-fun5 and samkirk-v3's defense-in-depth stack.

## Requirements

### R1: reCAPTCHA with Server-Side Verification

- Add Google reCAPTCHA (v2 Checkbox or v3) to the frontend
- Add a server-side token verification step in the API route before calling Gemini
- Configure reCAPTCHA for all relevant domains (localhost, vercel.app, photo-fun.samkirk.com)
- Reject requests with missing or invalid CAPTCHA tokens with a clear error response

### R2: Server-Side Rate Limiting

- Implement persistent server-side rate limiting (not in-memory, not client-side)
- Use Upstash Redis (Vercel-native) or equivalent persistent store
- Key on IP address (no sessions in photo-fun5)
- Enforce a reasonable window (e.g., 10 requests per 10 minutes per IP)
- Return 429 with a clear message when rate limit is exceeded
- Ensure atomicity (no race conditions on concurrent requests)

### R3: Hard Spend Cap

- Track cumulative Gemini API usage in a persistent store (Upstash Redis/KV)
- Enforce a monthly spend cap in the API route — refuse requests with 503 when exceeded
- The cap must be enforced in code, not just via GCP budget alerts
- Provide a mechanism to reset the counter (monthly or manual)

### R4: Input Validation

- Add schema validation (Zod or equivalent) at the API boundary
- Validate: payload size limits, image MIME type allowlist, prompt length constraints
- Reject invalid requests with clear 400 responses before any Gemini API call

### R5: Remove Debug Info Leak

- Remove or gate the `debug` object in `api/image-edit.ts` that is exposed on Vercel preview deployments where `NODE_ENV !== 'production'`
- Debug info should never be returned in API responses on any deployment

### R6: Add gitleaks to CI

- Add gitleaks as a step in the GitHub Actions CI workflow
- Match samkirk-v3's secret scanning gate

## Out of Scope

These items were identified in the audit as architectural differences that are appropriate for photo-fun5's current design:

- **Session management** — photo-fun5 is stateless by design (SPA + single serverless function)
- **Centralized protection wrapper** — only one API route exists; not needed until more are added
- **Admin authentication** — no admin interface exists
- **CSP / HSTS headers** — listed as a shared gap for both projects; can be a separate effort
- **samkirk-v3 polish items** — not in scope for this project

## Success Criteria

1. All 6 requirements implemented and deployed to production
2. `npx tsc --noEmit` and `npm run build` pass
3. Risk matrix scores for photo-fun5 improve:
   - Unauthenticated API abuse: High → Low
   - Cost runaway: Medium → Low
   - Bot/scraper abuse: Medium → Low
   - Secret leakage in CI: Medium → Low
   - Debug info exposure: Low → None
