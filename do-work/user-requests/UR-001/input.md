---
id: UR-001
title: "Ingest: SECURITY TODO (7 steps)"
created_at: 2026-02-19T12:00:00Z
requests: [REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007]
word_count: 474
---

# Ingest: SECURITY TODO

## Summary
Ingested 7 unchecked steps from docs/SECURITY-TODO.md into do-work REQ files.
Document set: SECURITY-SPECIFICATION.md, SECURITY-BLUEPRINT.md, SECURITY-TODO.md.

## Extracted Requests

| ID | Step | Title | Model Hint |
|----|------|-------|------------|
| REQ-001 | 1 | Remove Debug Info Leak | Sonnet 4 |
| REQ-002 | 2 | Add Input Validation with Zod | Opus 4.5 |
| REQ-003 | 3 | Add gitleaks to CI | Sonnet 4 |
| REQ-004 | 4 | Add reCAPTCHA | Opus 4.5 |
| REQ-005 | 5 | Add Server-Side Rate Limiting | Opus 4.5 |
| REQ-006 | 6 | Add Hard Spend Cap | Opus 4.5 |
| REQ-007 | 7 | Integration Testing and Validation | Gemini 3 Pro |

## Full Verbatim Input

# Security Hardening TODO: photo-fun5

**Specification:** `docs/SECURITY-SPECIFICATION.md`
**Blueprint:** `docs/SECURITY-BLUEPRINT.md`
**Source audit:** `docs/SECURITY-comparison-report.md`

---

## Model Recommendations

- **Steps 1, 3:** Sonnet 4 (quick fixes)
- **Steps 2, 4, 5, 6:** Opus 4.5 (backend/frontend logic)
- **Step 7:** Gemini 3 Pro (E2E testing / visual validation)

---

## Step 1: Remove Debug Info Leak

- [ ] 1.1 Find the `debug` object in `api/image-edit.ts` response
- [ ] 1.2 Remove debug info from all response paths
- [ ] 1.3 Validate: `npm run build` passes, no `debug` in responses

## Step 2: Add Input Validation with Zod

- [ ] 2.1 Install Zod (`npm install zod`)
- [ ] 2.2 Define request schema (imageBase64, prompt, mimeType)
- [ ] 2.3 Replace existing null check with `schema.safeParse()`
- [ ] 2.4 Return 400 with safe error message on validation failure
- [ ] 2.5 Validate: `npx tsc --noEmit` and `npm run build`

## Step 3: Add gitleaks to CI

- [ ] 3.1 Add gitleaks step to `.github/workflows/ci.yml`
- [ ] 3.2 Use `gitleaks/gitleaks-action` GitHub Action
- [ ] 3.3 Validate: push test commit, confirm gitleaks step runs green

## Step 4: Add reCAPTCHA

- [ ] 4.1 Register reCAPTCHA v2 site key in Google console
- [ ] 4.2 Configure domains (localhost, vercel.app, photo-fun.samkirk.com)
- [ ] 4.3 Add reCAPTCHA script tag to `index.html`
- [ ] 4.4 Add reCAPTCHA checkbox widget to UI
- [ ] 4.5 Capture token and include in API request payload
- [ ] 4.6 Add `RECAPTCHA_SECRET_KEY` to Vercel env vars and `.env.local`
- [ ] 4.7 Verify token server-side before calling Gemini
- [ ] 4.8 Reject missing/invalid tokens with 403
- [ ] 4.9 Update Zod schema to include `captchaToken`
- [ ] 4.10 Validate: `npx tsc --noEmit`, `npm run build`, manual test

## Step 5: Add Server-Side Rate Limiting

- [ ] 5.1 Create Upstash Redis instance
- [ ] 5.2 Install `@upstash/redis` and `@upstash/ratelimit`
- [ ] 5.3 Add Upstash env vars to Vercel and `.env.local`
- [ ] 5.4 Implement sliding window rate limit (10 req / 10 min per IP)
- [ ] 5.5 Return 429 with `Retry-After` header when exceeded
- [ ] 5.6 Validate: `npx tsc --noEmit`, `npm run build`

## Step 6: Add Hard Spend Cap

- [ ] 6.1 Define `MONTHLY_SPEND_CAP_CENTS` env var
- [ ] 6.2 Increment spend counter in Upstash Redis after each Gemini call
- [ ] 6.3 Check spend cap before calling Gemini, return 503 when exceeded
- [ ] 6.4 Set TTL on spend keys for auto-expiry
- [ ] 6.5 Add env var to Vercel
- [ ] 6.6 Validate: `npx tsc --noEmit`, `npm run build`

## Step 7: Integration Testing and Validation

- [ ] 7.1 Test: no CAPTCHA → 403
- [ ] 7.2 Test: invalid CAPTCHA → 403
- [ ] 7.3 Test: valid CAPTCHA, normal request → success
- [ ] 7.4 Test: exceed rate limit → 429
- [ ] 7.5 Test: invalid input (bad MIME, oversized) → 400
- [ ] 7.6 Verify debug info removed from all responses
- [ ] 7.7 Verify gitleaks runs in CI
- [ ] 7.8 `npx tsc --noEmit` and `npm run build` pass
- [ ] 7.9 Deploy to preview and test on Vercel

---
*Captured: 2026-02-19T12:00:00Z*
