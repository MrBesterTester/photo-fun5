# Security Audit: photo-fun5 (Post-Hardening)

**Benchmarked against:** samkirk-v3 (production-grade reference implementation)
**Date:** 2026-02-19
**Previous audit:** [SECURITY-comparison-report.md](SECURITY-comparison-report.md) (2026-02-18)
**Changes:** REQ-001 through REQ-008

---

## Executive Summary

All 6 primary recommendations from the 2026-02-18 audit have been implemented. photo-fun5 now has a multi-layered protection stack (Zod validation -> reCAPTCHA -> rate limit -> spend cap) comparable to samkirk-v3's defense-in-depth approach. The remaining differences are architectural choices appropriate for photo-fun5's single-route, stateless SPA design.

| | samkirk-v3 | photo-fun5 (before) | photo-fun5 (after) |
|---|---|---|---|
| **Overall posture** | Production-grade, defense-in-depth | Minimal, platform-reliant | **Defense-in-depth, at parity** |

---

## Recommendation Status

| # | Recommendation | REQ | Status |
|---|---|---|---|
| 1 | reCAPTCHA with server-side verification | REQ-004 | **Done** |
| 2 | Server-side rate limiting with persistent storage | REQ-005 | **Done** |
| 3 | Hard spend cap enforced in API route | REQ-006, REQ-008 | **Done** |
| 4 | Input validation with Zod | REQ-002 | **Done** |
| 5 | Remove debug info leak | REQ-001 | **Done** |
| 6 | gitleaks in CI | REQ-003 | **Done** |

---

## Implementation Details

### 1. reCAPTCHA (REQ-004)

| | samkirk-v3 | photo-fun5 |
|---|---|---|
| **Version** | v2 Checkbox | v2 Checkbox |
| **Frontend** | Widget + token capture | Widget in `ChatInterface.tsx`, submit disabled until solved |
| **Server-side** | Google siteverify API | Google siteverify in `api/image-edit.ts` (returns 403) |
| **Schema** | Zod validated | `captchaToken: z.string().min(1)` |

**Production note:** Currently using Google's test key. Production key must be set as `RECAPTCHA_SECRET_KEY` in Vercel env vars with production domain in Google console allowlist.

### 2. Rate Limiting (REQ-005)

| | samkirk-v3 | photo-fun5 |
|---|---|---|
| **Server-side** | 10 req / 10 min (Firestore) | 10 req / 10 min (Upstash Redis) |
| **Key strategy** | SHA256(sessionId + ipHash) | IP from `x-forwarded-for` |
| **Atomicity** | Firestore transactions | Upstash sliding window (atomic) |
| **Response** | 429 | 429 with `Retry-After` header |
| **Vercel WAF** | 5 req / 600s per IP | 5 req / 600s per IP |

### 3. Spend Cap (REQ-006, REQ-008)

| | samkirk-v3 | photo-fun5 |
|---|---|---|
| **Hard cap** | Yes (Firestore, returns 503) | Yes (Upstash Redis, returns 503) |
| **Cost tracking** | Token-based | Token-based (primary) + text-based fallback |
| **Granularity** | Monthly | Monthly (key: `spend:{YYYY-MM}`, 35-day TTL) |
| **Default cap** | Configurable | $20/mo (`MONTHLY_SPEND_CAP_CENTS` env var) |
| **Atomicity** | Firestore transactions | Redis `incrby` (atomic) |

### 4. Input Validation (REQ-002)

| | samkirk-v3 | photo-fun5 |
|---|---|---|
| **Library** | Zod | Zod |
| **Image size** | Schema-validated | Max 14 MB (base64) |
| **Prompt length** | Schema-validated | Max 1,000 chars |
| **MIME types** | Validated | Allowlist: jpeg, png, webp, gif |
| **CAPTCHA token** | Required field | Required, `min(1)` |

### 5. Debug Info Leak (REQ-001)

| | samkirk-v3 | photo-fun5 (before) | photo-fun5 (after) |
|---|---|---|---|
| **Debug exposure** | None | `debug` object on preview deploys | **None** |

### 6. CI/CD Security (REQ-003)

| | samkirk-v3 | photo-fun5 (before) | photo-fun5 (after) |
|---|---|---|---|
| **Secret scanning** | gitleaks (CI) + pre-push hook | None | **gitleaks in CI** (`gitleaks-action@v2`) |
| **Dependency audit** | npm audit | npm audit | npm audit |
| **Static analysis** | CodeQL | CodeQL | CodeQL |

---

## Protection Flow Comparison

**samkirk-v3:**
```
Request -> Session -> CAPTCHA -> Rate Limit -> Spend Cap -> Vertex AI
            (401)     (403)       (429)         (503)
```

**photo-fun5 (after):**
```
Request -> Zod Validation -> CAPTCHA -> Rate Limit -> Spend Cap -> Gemini API
              (400)           (403)       (429)         (503)
```

---

## Updated Risk Matrix

| Risk | samkirk-v3 | photo-fun5 (before) | photo-fun5 (after) |
|---|---|---|---|
| **Unauthenticated API abuse** | Low | **High** | Low |
| **Cost runaway** | Low | **Medium** | Low |
| **Bot/scraper abuse** | Low | **Medium** | Low |
| **Secret leakage in CI** | Low | Medium | Low |
| **Debug info exposure** | None | **Low** | None |
| **Supply chain attack** | Low | Low-Medium | Low |

---

## Remaining Architectural Differences

These are design choices, not vulnerabilities. They would only become gaps if photo-fun5's scope expanded.

| Difference | Why it's fine |
|---|---|
| **No session management** | Stateless SPA with one endpoint; no user-specific state to track |
| **No centralized `withToolProtection()`** | Single API route; wrapper would add complexity with no benefit |
| **No admin authentication** | No admin interface exists |
| **IP-based vs session+IP keying** | No sessions to combine; IP-only is appropriate for stateless design |

---

## Production Readiness Checklist

These env vars must be configured **before** REQ-012 (integration testing), since REQ-012 validates the full protection flow end-to-end and the protections gracefully degrade to pass-through when credentials are missing.

- [ ] Replace reCAPTCHA test key with production key in Vercel env (`RECAPTCHA_SECRET_KEY`)
- [ ] Add production domain to Google reCAPTCHA console allowlist
- [ ] Verify Upstash Redis credentials in Vercel env (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`)
- [ ] Confirm `MONTHLY_SPEND_CAP_CENTS` value is appropriate
- [ ] Test all error paths in staging (invalid CAPTCHA -> 403, rate limit -> 429, spend cap -> 503)
