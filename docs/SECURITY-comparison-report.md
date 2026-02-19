# Security Audit: photo-fun5

**Benchmarked against:** samkirk-v3 (production-grade reference implementation)
**Date:** 2026-02-18
**Based on:** REQ-129, REQ-133, REQ-117, REQ-118, REQ-095, REQ-096, REQ-097, REQ-098 + codebase analysis

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [1. reCAPTCHA](#1-recaptcha)
- [2. Rate Limiting](#2-rate-limiting)
- [3. Cost Controls](#3-cost-controls)
- [4. API Route Protection](#4-api-route-protection)
- [5. Bot Protection (Platform-Level)](#5-bot-protection-platform-level)
- [6. CI/CD Security](#6-cicd-security)
- [7. Secrets Management](#7-secrets-management)
- [8. Content Security Policy and Security Headers](#8-content-security-policy-and-security-headers)
- [9. Deployment Platform Security (Vercel)](#9-deployment-platform-security-vercel)
- [10. Dependencies and Supply Chain](#10-dependencies-and-supply-chain)
- [Risk Matrix](#risk-matrix)
- [Recommendations](#recommendations)
  - [Primary: photo-fun5 hardening](#primary-photo-fun5-hardening-priority-order)
  - [Secondary: samkirk-v3 polish items](#secondary-samkirk-v3-polish-items)
  - [Secondary: shared items](#secondary-shared-items)

---

## Executive Summary

This report audits photo-fun5's security posture using samkirk-v3 as a production-grade benchmark. samkirk-v3 has a mature, multi-layered defense-in-depth stack (session, CAPTCHA, rate limit, spend cap). photo-fun5 relies almost entirely on Vercel WAF and Gemini's own API tier limits, with no application-level protection. The gap is significant, and this report identifies the specific layers photo-fun5 is missing and prioritizes closing them.

| | samkirk-v3 | photo-fun5 |
|---|---|---|
| **Framework** | Next.js (SSR) | Vite + React (SPA) |
| **LLM** | Vertex AI (text-only) | Gemini (image processing) |
| **Hosting** | Vercel | Vercel |
| **Overall posture** | Production-grade, defense-in-depth | Minimal, platform-reliant |

---

## 1. reCAPTCHA

| | samkirk-v3 | photo-fun5 |
|---|---|---|
| **Version** | v2 Checkbox | v3 (dead code, key deleted) |
| **Status** | Active, verified in Google console | Key deleted 2026-02-18 |
| **Domains** | samkirk.com, localhost, vercel.app | Was localhost/127.0.0.1 only |
| **Integration** | Frontend widget + server-side token verification | `initializeSecurity()` was never called |
| **Bypass controls** | Only `E2E_TESTING=true` (REQ-095 tightened this) | N/A |

### Assessment

samkirk-v3 has proper CAPTCHA gating before any tool use. photo-fun5 has zero CAPTCHA protection -- anyone can hit `/api/image-edit` directly.

### v2 vs v3 Complexity (REQ-129)

v3 is score-based and invisible, which sounds simpler for users but is harder to implement correctly because you must decide score thresholds and handle low-score fallbacks. v2 Checkbox is straightforward -- pass or fail. For samkirk-v3's use case (gating expensive LLM calls), v2 is arguably the better choice: explicit user friction is a feature, not a bug.

---

## 2. Rate Limiting

| | samkirk-v3 | photo-fun5 |
|---|---|---|
| **Server-side** | 10 req / 10 min (Firestore-backed, SHA256 of session+IP) | None |
| **Client-side** | None needed | 10 req / session (React state, trivially bypassable) |
| **Vercel WAF** | 5 req / 600s per IP on `/api/tools/*` | 5 req / 600s per IP on `/api/image-edit` |
| **API-level** | None (Vertex AI doesn't enforce RPD) | ~20 RPD (Gemini Tier 1) |
| **Atomicity** | Firestore transactions | N/A |
| **Key strategy** | SHA256(sessionId + ipHash) | N/A |

### Assessment

samkirk-v3 has two layers (application code + WAF). photo-fun5 relies on WAF + Gemini's own quota. The client-side `MAX_SESSION_REQUESTS = 10` in photo-fun5's `App.tsx` is security theater -- a `curl` to `/api/image-edit` bypasses it entirely.

---

## 3. Cost Controls

| | samkirk-v3 | photo-fun5 |
|---|---|---|
| **Spend cap** | Monthly cap in Firestore (enforced in code via `withToolProtection()`) | None (GCP budget alerts are notification-only) |
| **Per-request cap** | Token limits on Vertex AI calls | 8,192 output tokens (~$0.13/req) |
| **Budget alerts** | Firestore-tracked | $20/mo GCP alerts at 50%/90%/100% |
| **Validation tooling** | `npm run validate:spend` script (REQ-098) | None |
| **Hard cap?** | Yes (returns 503 when exceeded) | No -- alerts don't stop spending |

### Assessment

samkirk-v3 will refuse requests when the spend cap is hit. photo-fun5 will keep serving requests until Gemini's API quota runs out or the GCP budget alert emails pile up.

---

## 4. API Route Protection

| | samkirk-v3 | photo-fun5 |
|---|---|---|
| **Protection flow** | Session -> Captcha -> Rate Limit -> Spend Cap | None (raw endpoint) |
| **Centralized?** | Yes -- `withToolProtection()` wrapper (REQ-096/097) | N/A |
| **Session management** | Server-side sessions with Firestore | None |
| **Session security** | 32-byte random ID, httpOnly/secure/sameSite=strict cookie, 7-day TTL | N/A |
| **Input validation** | Zod schemas at API boundaries | Basic null check (`!imageBase64 \|\| !prompt`) |
| **CORS** | Next.js defaults (same-origin) | Vercel defaults |
| **Debug info leak** | None in production | `debug` object returned when `NODE_ENV !== 'production'` |

### Assessment

samkirk-v3's tool routes are behind 4 sequential security checks, centralized in a single wrapper. photo-fun5's single API route has zero authentication, zero session management, and leaks debug info on Vercel preview deployments.

---

## 5. Bot Protection (Platform-Level)

| | samkirk-v3 | photo-fun5 |
|---|---|---|
| **Vercel Bot Protection** | JS challenge for non-browser traffic | Same (shared account) |
| **AI Bot Blocking** | Deny (GPTBot, ClaudeBot, PerplexityBot, etc.) | Same |
| **DDoS Mitigation** | Active | Active |

### Assessment

Equivalent -- both benefit from the same Vercel account settings (REQ-118).

---

## 6. CI/CD Security

| | samkirk-v3 | photo-fun5 |
|---|---|---|
| **Secret scanning** | gitleaks (CI) + pre-push hook | None in CI |
| **Dependency audit** | npm audit (moderate+, non-blocking) | npm audit (moderate+, non-blocking) |
| **Static analysis** | CodeQL (JavaScript) | CodeQL (JavaScript) |
| **Lint** | ESLint in CI | TypeScript type-check only |
| **Pre-push hooks** | gitleaks detect | None |

### Assessment

samkirk-v3 has gitleaks as an additional gate that photo-fun5 lacks. Both have CodeQL and npm audit.

---

## 7. Secrets Management

| | samkirk-v3 | photo-fun5 |
|---|---|---|
| **API keys** | GCP service account JSON in Vercel env vars | `GEMINI_API_KEY` in Vercel env vars |
| **Key rotation** | SA key recreated 2026-02-19 after deletion incident | No rotation history |
| **Local dev** | `.env.local` (gitignored) | `.env.local` (gitignored) + hand-rolled parser |
| **Secret access** | GCP Secret Manager (via SA role) | Direct env var |
| **Schema validation** | Zod with strict type checking at startup | String presence check only |
| **Server-only enforcement** | `server-only` pragma prevents client-side imports | API key checked in serverless function |

### Assessment

samkirk-v3 uses GCP Secret Manager for production secrets with Zod validation at startup. photo-fun5 has a hand-rolled `.env.local` parser in the API route itself (lines 16-28 of `image-edit.ts`) which is fragile but functional.

---

## 8. Content Security Policy and Security Headers

| | samkirk-v3 | photo-fun5 |
|---|---|---|
| **CSP** | None explicit (Vercel defaults) | None |
| **HSTS** | None explicit (Vercel defaults) | None |
| **X-Frame-Options** | None explicit (Vercel defaults) | None |
| **Cookie security** | httpOnly, secure, sameSite=strict | N/A (no cookies) |

### Assessment

Neither project sets explicit security headers -- both rely on Vercel's defaults. This is a shared gap. samkirk-v3 does have secure cookie configuration for its sessions.

---

## 9. Deployment Platform Security (Vercel)

Both projects benefit from the same Vercel platform features:

- **HTTPS**: Enforced automatically on all domains
- **DDoS protection**: Automatic via Vercel's edge network
- **Serverless isolation**: Functions isolated by default
- **Secrets encryption**: Environment variables encrypted at rest

### Vercel WAF Rules (as of 2026-02-18)

| | samkirk-v3 | photo-fun5 |
|---|---|---|
| **WAF path** | Starts with `/api/tools/` | Equals `/api/image-edit` |
| **Window** | 600s | 600s |
| **Requests/window** | 5 per IP | 5 per IP |
| **Action** | 429 | 429 |

Both rules were aligned on 2026-02-18 (REQ-133). samkirk-v3's WAF rule was tightened from 20 req/60s to 5 req/600s to match photo-fun5.

---

## 10. Dependencies and Supply Chain

### samkirk-v3

Key security-relevant dependencies:

- `next@16.1.6` -- SSR, API routes
- `next-auth@5.0.0-beta.30` -- OAuth and session management (beta)
- `@google-cloud/firestore@8.2.0` -- Rate limits, spend cap, sessions
- `zod@4.3.6` -- Input validation
- `server-only@0.0.1` -- Prevents accidental client-side imports

### photo-fun5

Key security-relevant dependencies:

- `@google/genai` -- Gemini API client
- `firebase@12.8.0` -- App Check integration (dead code)

### Assessment

samkirk-v3 has a larger dependency surface due to Next.js but mitigates this with gitleaks + CodeQL + npm audit. photo-fun5 has a smaller dependency tree. Both run npm audit in CI.

---

## Risk Matrix

| Risk | samkirk-v3 | photo-fun5 |
|---|---|---|
| **Unauthenticated API abuse** | Low (4-layer protection) | **High** (no auth, no session, no CAPTCHA) |
| **Cost runaway** | Low (Firestore spend cap enforced) | **Medium** (Gemini quota + budget alerts, no hard cap) |
| **Bot/scraper abuse** | Low (CAPTCHA + WAF + bot protection) | **Medium** (WAF + bot protection only) |
| **Secret leakage in CI** | Low (gitleaks + CodeQL) | Medium (CodeQL only, no gitleaks) |
| **Debug info exposure** | None | **Low** (debug object in non-prod; exposed on preview deploys) |
| **Session hijacking** | Low (32-byte random, httpOnly, secure, strict) | N/A (no sessions) |
| **Supply chain attack** | Low (npm audit + CodeQL + gitleaks) | Low-Medium (npm audit + CodeQL) |

---

## Recommendations

### Primary: photo-fun5 hardening (priority order)

These recommendations are ordered to bring photo-fun5 toward parity with samkirk-v3's multi-layered protection stack (session -> CAPTCHA -> rate limit -> spend cap). The first three items close the structural gaps; the rest are hardening.

1. **Add reCAPTCHA with server-side verification** -- the most important missing layer. Without CAPTCHA, an attacker can programmatically hit `/api/image-edit` without proving they're human. samkirk-v3 uses v2 Checkbox with server-side token verification via Google's API; photo-fun5 should add the same (v2 or v3) with a Vercel serverless verification step before calling Gemini.
2. **Add server-side rate limiting with persistent storage** -- not in-memory (resets on cold start) or client-side (trivially bypassable). samkirk-v3 uses Firestore with SHA256(session+IP) keying and atomic transactions. For photo-fun5, Upstash Redis (Vercel-native) with IP-based keying would be the closest equivalent without adding Firestore.
3. **Add a hard spend cap enforced in the API route** -- samkirk-v3 checks spend in-code and returns 503 when exceeded. photo-fun5 should track cumulative Gemini usage (even a simple counter in KV or Redis) and refuse requests past the threshold, rather than relying on GCP budget alerts that only send emails.
4. **Add proper input validation** -- samkirk-v3 uses Zod schemas at every API boundary. photo-fun5 only checks `!imageBase64 || !prompt`. Add schema validation for payload size limits, MIME type allowlists, and prompt length constraints.
5. **Remove debug info leak** -- the `debug` object at line 144 of `api/image-edit.ts` is exposed on Vercel preview deployments where `NODE_ENV !== 'production'`. Remove or gate behind an internal flag.
6. **Add gitleaks to CI** -- one extra step in the GitHub Actions workflow. Matches samkirk-v3's secret scanning gate.

#### Remaining differences after all 6 recommendations

With all items implemented, photo-fun5's security posture would be broadly comparable to samkirk-v3's for its current scope. The following architectural differences would remain, but these are only potential concerns -- none represent current vulnerabilities given photo-fun5's single-route, stateless design:

- **No session management** -- samkirk-v3 has Firestore-backed sessions with secure cookies. photo-fun5 is stateless by design (SPA + single serverless function), which is appropriate for its simpler use case. This would only become a real gap if photo-fun5 added user-specific features or multi-step workflows that require tracking state across requests.
- **No centralized protection wrapper** -- samkirk-v3 has `withToolProtection()` enforcing all checks in sequence across 5 routes. photo-fun5 has a single API route, so centralization provides no benefit today. This would only matter if additional API routes were added.
- **No admin authentication** -- samkirk-v3 has NextAuth + Google OAuth + email allowlist. photo-fun5 has no admin interface, so there is nothing to protect. Only relevant if an admin panel were introduced.

### Secondary: samkirk-v3 polish items

samkirk-v3's security posture is production-grade. These are minor hardening items, not gaps:

1. **Add explicit security headers** -- CSP, HSTS, X-Frame-Options in `next.config.ts`
2. **Monitor next-auth beta** -- currently on `5.0.0-beta.30`; upgrade to stable when available
3. **Validate reverse proxy headers** -- currently trusts `x-forwarded-for` from any source; ensure Vercel's edge correctly sets these

### Secondary: shared items

1. **Add explicit CSP headers** -- neither project defines a Content Security Policy
2. **Consider HSTS preload** -- both domains should submit for HSTS preload lists

---

## Follow-Up

All 6 primary recommendations were implemented on 2026-02-19 (REQ-001 through REQ-008). See [SECURITY-comparison-report_2.md](SECURITY-comparison-report_2.md) for the post-hardening audit.
