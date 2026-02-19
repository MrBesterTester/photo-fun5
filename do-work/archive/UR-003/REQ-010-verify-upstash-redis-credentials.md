---
id: REQ-010
title: Provision Upstash Redis via Vercel Marketplace
status: completed
claimed_at: 2026-02-19T19:05:00Z
route: A
completed_at: 2026-02-19T19:35:00Z
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

Completed with guided human-in-the-loop workflow:

1. **Vercel project re-linked** — `vercel link --yes --scope sam-kirks-projects` (done in REQ-009)
2. **Upstash Redis provisioned** via Vercel Marketplace Storage tab → Upstash → Redis
   - Database name: `upstash-photo-fun`
   - Connected to `photo-fun5` project (Development, Preview, Production)
   - Custom prefix `UPSTASH_REDIS_REST` used — created vars with `UPSTASH_REDIS_REST_KV_REST_API_*` naming
3. **Env var name mismatch fixed** — Marketplace prefix prepended to default names (e.g. `UPSTASH_REDIS_REST_KV_REST_API_URL`) instead of replacing them. Used `vercel env pull` to extract values, then created correctly-named vars:
   - `UPSTASH_REDIS_REST_URL` (Production)
   - `UPSTASH_REDIS_REST_TOKEN` (Production)
4. **SDK already installed** — `@upstash/redis` and `@upstash/ratelimit` in `package.json`, imported in `api/image-edit.ts`
5. **No code changes needed** — existing code will pick up credentials and enable rate limiting + spend cap

*Completed by work action (Route A) with human-in-the-loop*

## Testing

**Tests run:** `vercel env ls` — confirmed `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` present for Production
**Result:** Env vars verified. Full integration validation deferred to REQ-012.

*Verified by work action*
