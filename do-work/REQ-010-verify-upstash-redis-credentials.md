---
id: REQ-010
title: Provision Upstash Redis via Vercel Marketplace
status: pending
created_at: 2026-02-19T18:00:00Z
user_request: UR-003
related: [REQ-005, REQ-006, REQ-007]
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
Rate limiting (REQ-005) and spend cap (REQ-006) both depend on Upstash Redis. The code is already implemented but credentials are not configured — both protections currently degrade to pass-through. Must be done before REQ-007 (integration testing). Vercel Hobby plan includes 30,000 free KV requests/month, which is sufficient.

---
*Source: docs/SECURITY-comparison-report_2.md, Production Readiness Checklist item 3*
