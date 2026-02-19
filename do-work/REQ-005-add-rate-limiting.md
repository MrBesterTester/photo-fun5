---
id: REQ-005
title: "Add Server-Side Rate Limiting"
status: pending
created_at: 2026-02-19T12:00:00Z
user_request: UR-001
related: [REQ-001, REQ-002, REQ-003, REQ-004, REQ-006, REQ-007]
batch: "SECURITY-step-5"
source_step: "5"
source_doc: "docs/SECURITY-TODO.md"
blueprint_ref: "docs/SECURITY-BLUEPRINT.md"
model_hint: "Opus 4.5"
---

# Add Server-Side Rate Limiting (Step 5)

## What
Set up Upstash Redis and implement persistent server-side rate limiting (sliding window, 10 req / 10 min per IP) in `api/image-edit.ts` to prevent API abuse.

## Checklist
- [ ] 5.1 Create Upstash Redis instance
- [ ] 5.2 Install `@upstash/redis` and `@upstash/ratelimit`
- [ ] 5.3 Add Upstash env vars to Vercel and `.env.local`
- [ ] 5.4 Implement sliding window rate limit (10 req / 10 min per IP)
- [ ] 5.5 Return 429 with `Retry-After` header when exceeded
- [ ] 5.6 Validate: `npx tsc --noEmit`, `npm run build`

## Blueprint Guidance
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

## Context
- **Document set**: SECURITY
- **Specification**: See docs/SECURITY-SPECIFICATION.md for full requirements (R2: Server-Side Rate Limiting)
- **Model recommendation**: Opus 4.5 (advisory — use if your tool supports model selection)

## Dependencies
Depends on Step 4 (REQ-004) for the protection flow ordering (rate limit comes after CAPTCHA). Item 5.1 requires manual Upstash console setup. Step 6 (REQ-006) reuses the same Upstash Redis instance.

---
*Source: docs/SECURITY-TODO.md, Step 5*
