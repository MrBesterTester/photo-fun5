# Security Hardening Blueprint: photo-fun5

**Specification:** `docs/SECURITY-SPECIFICATION.md`
**Source audit:** `docs/SECURITY-comparison-report.md`
**Date:** 2026-02-19

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Step 1: Remove Debug Info Leak](#step-1-remove-debug-info-leak)
- [Step 2: Add Input Validation with Zod](#step-2-add-input-validation-with-zod)
- [Step 3: Add gitleaks to CI](#step-3-add-gitleaks-to-ci)
- [Step 4: Add reCAPTCHA](#step-4-add-recaptcha)
- [Step 5: Add Server-Side Rate Limiting](#step-5-add-server-side-rate-limiting)
- [Step 6: Add Hard Spend Cap](#step-6-add-hard-spend-cap)
- [Step 7: Integration Testing and Validation](#step-7-integration-testing-and-validation)
- [Dependencies and Services](#dependencies-and-services)
- [Environment Variables](#environment-variables)

---

## Architecture Overview

After implementation, the API route protection flow will be:

```
Request → Input Validation (Zod) → reCAPTCHA Verification → Rate Limit Check → Spend Cap Check → Gemini API Call
```

All checks happen in `api/image-edit.ts`. No centralized wrapper is needed (single route).

### Persistent Storage: Upstash Redis

Upstash Redis is the recommended persistent store for rate limiting and spend cap tracking. It's Vercel-native, serverless-friendly (HTTP-based, no persistent connections), and has a generous free tier.

---

## Step 1: Remove Debug Info Leak

**Requirement:** R5
**Model:** Sonnet 4 (quick fix)
**Files:** `api/image-edit.ts`

1.1. Find the `debug` object in the API response
1.2. Remove it entirely from all response paths (not just gate behind `NODE_ENV`)
1.3. Validate: `npm run build`, confirm no `debug` field in any response

**Why first:** Smallest change, immediate security improvement, zero dependencies.

---

## Step 2: Add Input Validation with Zod

**Requirement:** R4
**Model:** Opus 4.5 (backend logic)
**Files:** `api/image-edit.ts`, `package.json`

2.1. Install Zod: `npm install zod`
2.2. Define a request schema:
  - `imageBase64`: string, max length (e.g., 10MB base64 ≈ 13.3M chars)
  - `prompt`: string, min 1 char, max 1000 chars
  - `mimeType`: enum of allowed types (`image/jpeg`, `image/png`, `image/webp`, `image/gif`)
2.3. Replace the existing `!imageBase64 || !prompt` check with `schema.safeParse()`
2.4. Return 400 with a safe error message on validation failure (no internal details)
2.5. Validate: `npx tsc --noEmit`, `npm run build`

---

## Step 3: Add gitleaks to CI

**Requirement:** R6
**Model:** Sonnet 4 (quick fix)
**Files:** `.github/workflows/ci.yml`

3.1. Add a gitleaks step to the existing CI workflow
3.2. Use the official `gitleaks/gitleaks-action` GitHub Action
3.3. Run on push and pull_request events (same as existing CI triggers)
3.4. Validate: push a test commit, confirm gitleaks step runs green

---

## Step 4: Add reCAPTCHA

**Requirement:** R1
**Model:** Opus 4.5 (frontend + backend)
**Files:** `src/App.tsx` (or relevant component), `api/image-edit.ts`, `index.html`, `.env.local`

### 4a: Choose v2 vs v3

**Recommendation: v2 Checkbox.** Explicit user friction is a feature for gating expensive LLM calls. Simpler to implement (pass/fail, no score thresholds).

### 4b: Frontend

4b.1. Register a new reCAPTCHA v2 site key in Google reCAPTCHA console
4b.2. Configure domains: `localhost`, `photo-fun5.vercel.app`, `photo-fun.samkirk.com`
4b.3. Add the reCAPTCHA script tag to `index.html`
4b.4. Add the reCAPTCHA checkbox widget to the UI (before the "generate" button or equivalent)
4b.5. Capture the token and include it in the API request payload

### 4c: Backend

4c.1. Add `RECAPTCHA_SECRET_KEY` to Vercel environment variables
4c.2. Before calling Gemini, verify the token with Google's `siteverify` API
4c.3. Reject requests with missing/invalid/expired tokens (return 403)
4c.4. Update the Zod schema to include `captchaToken: z.string().min(1)`

### 4d: Validation

4d.1. `npx tsc --noEmit`, `npm run build`
4d.2. Manual test: submit without CAPTCHA → 403; submit with CAPTCHA → proceeds

---

## Step 5: Add Server-Side Rate Limiting

**Requirement:** R2
**Model:** Opus 4.5 (backend logic)
**Files:** `api/image-edit.ts`, `package.json`, `.env.local`

5.1. Create an Upstash Redis instance via the Upstash console or Vercel integration
5.2. Install: `npm install @upstash/redis @upstash/ratelimit`
5.3. Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to Vercel env vars and `.env.local`
5.4. Implement rate limiting in `api/image-edit.ts`:
  - Use `@upstash/ratelimit` with sliding window: 10 requests per 10 minutes
  - Key on IP from `x-forwarded-for` header (Vercel sets this reliably)
  - Place the check after CAPTCHA verification, before Gemini call
5.5. Return 429 with `Retry-After` header when limit exceeded
5.6. Validate: `npx tsc --noEmit`, `npm run build`

---

## Step 6: Add Hard Spend Cap

**Requirement:** R3
**Model:** Opus 4.5 (backend logic)
**Files:** `api/image-edit.ts`, `.env.local`

6.1. Define a monthly spend cap (e.g., `MONTHLY_SPEND_CAP_CENTS=2000` for $20)
6.2. After each successful Gemini call, increment a counter in Upstash Redis:
  - Key: `spend:{YYYY-MM}` (auto-expires after 35 days via TTL)
  - Value: estimated cost in cents per request (use token count × rate, or a flat per-request estimate)
6.3. Before calling Gemini, check if current month's spend exceeds the cap
6.4. Return 503 with a message like "Service temporarily unavailable — monthly usage limit reached"
6.5. Add `MONTHLY_SPEND_CAP_CENTS` to Vercel env vars
6.6. Validate: `npx tsc --noEmit`, `npm run build`

---

## Step 7: Integration Testing and Validation

**Model:** Gemini 3 Pro (debugging/visual/E2E)

7.1. Full manual test of the protection flow:
  - No CAPTCHA → 403
  - Invalid CAPTCHA → 403
  - Valid CAPTCHA, normal request → success
  - Exceed rate limit → 429
  - Invalid input (bad MIME type, oversized payload) → 400
7.2. Verify debug info is gone from all responses
7.3. Verify gitleaks runs in CI
7.4. `npx tsc --noEmit` and `npm run build` pass
7.5. Deploy to preview, test on Vercel

---

## Dependencies and Services

| Dependency | Purpose | Step |
|---|---|---|
| `zod` | Input validation schemas | 2 |
| `@upstash/redis` | Persistent Redis client | 5, 6 |
| `@upstash/ratelimit` | Rate limiting library | 5 |
| Google reCAPTCHA v2 | Bot protection | 4 |
| Upstash Redis instance | Rate limit + spend cap storage | 5, 6 |

## Environment Variables

| Variable | Where | Step |
|---|---|---|
| `RECAPTCHA_SECRET_KEY` | Vercel + `.env.local` | 4 |
| `RECAPTCHA_SITE_KEY` | Frontend (public, can be in code or env) | 4 |
| `UPSTASH_REDIS_REST_URL` | Vercel + `.env.local` | 5 |
| `UPSTASH_REDIS_REST_TOKEN` | Vercel + `.env.local` | 5 |
| `MONTHLY_SPEND_CAP_CENTS` | Vercel + `.env.local` | 6 |
