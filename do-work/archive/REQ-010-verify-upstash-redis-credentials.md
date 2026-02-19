---
id: REQ-010
title: Provision Upstash Redis via Vercel Marketplace
status: failed
claimed_at: 2026-02-19T19:05:00Z
route: A
error: "Requires human action — Upstash Redis must be provisioned via Vercel Marketplace dashboard, then env vars verified"
created_at: 2026-02-19T18:00:00Z
user_request: UR-003
related: [REQ-005, REQ-006, REQ-012]
---

# Provision Upstash Redis via Vercel Marketplace

## What
Provision Upstash Redis through the Vercel Marketplace and verify that the env vars (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) are populated in the Vercel project.

## Steps
1. Go to the Vercel project dashboard
2. Add Upstash Redis from the Marketplace (https://vercel.com/marketplace/upstash)
3. Let Vercel auto-provision the account (no separate Upstash sign-up needed)
4. Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are injected into the project env vars
5. No code changes needed — the existing `@upstash/redis` and `@upstash/ratelimit` code in `api/image-edit.ts` will use these env vars automatically

## Context
Rate limiting (REQ-005) and spend cap (REQ-006) both depend on Upstash Redis. The code is already implemented but credentials are not configured — both protections currently degrade to pass-through. Must be done before REQ-012 (integration testing). Vercel Hobby plan includes 30,000 free KV requests/month, which is sufficient.

---
*Source: docs/SECURITY-comparison-report_2.md, Production Readiness Checklist item 3*

---

## Triage

**Route: A** - Simple

**Reasoning:** Manual provisioning task — requires dashboard access to Vercel Marketplace to add Upstash Redis integration. No code changes needed. Cannot be automated.

**Planning:** Not required

## Plan

**Planning not required** - Route A: Direct implementation

Rationale: No code changes needed. The existing `@upstash/redis` and `@upstash/ratelimit` code in `api/image-edit.ts` already reads `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from env vars. Just need the provisioning step.

*Skipped by work action*

## Implementation Summary

**This REQ requires manual human action.** No code changes needed.

### Current state
- Code in `api/image-edit.ts` already uses `@upstash/redis` and `@upstash/ratelimit`
- Both degrade to pass-through when credentials are missing
- Vercel project link may need re-linking (`vercel link`)

### Steps for the user

1. **Fix Vercel project link** (if needed):
   ```
   vercel link
   ```

2. **Add Upstash Redis from Vercel Marketplace:**
   - Go to your Vercel project dashboard → Integrations
   - Add Upstash Redis from https://vercel.com/marketplace/upstash
   - Vercel auto-provisions the account (no separate Upstash sign-up)

3. **Verify env vars are populated:**
   ```
   vercel env ls | grep UPSTASH
   ```
   Should show `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

4. **Redeploy** to pick up the new env vars.

5. **Verify** rate limiting and spend cap are active (no more pass-through warnings in logs).

*Completed by work action (Route A) — marked as failed because it requires human action*

## Testing

**Tests run:** N/A — manual provisioning task
**Result:** REQ-012 (integration testing) will validate the full rate-limiting and spend-cap flow once credentials are in place.

*Verified by work action*
