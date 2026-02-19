---
id: REQ-013
title: Port CI deploy job from samkirk-v3
status: pending
created_at: 2026-02-19T20:30:00Z
user_request: UR-004
---

# Port CI Deploy Job from samkirk-v3

## What
Port the `deploy` job from `../samkirk-v3/.github/workflows/ci.yml` into this project's CI workflow, adjusted for photo-fun5's root-level layout (no `working-directory: web` needed).

## Context
samkirk-v3 has a full deploy pipeline that photo-fun5 is missing:
- `deploy` job gated on `build-and-test` + `security-scan` passing (`needs: [build-and-test, security-scan]`)
- Only runs on push to main (`if: github.event_name == 'push' && github.ref == 'refs/heads/main'`)
- Uses `environment: production` protection
- Vercel CLI: `vercel pull` → `vercel build --prod` → `vercel deploy --prebuilt --prod`
- Health check via `vercel inspect` retry loop (5 attempts, 10s apart)
- Requires secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

samkirk-v3 also has a `lint` step in `build-and-test` that photo-fun5 lacks. Include if a lint script exists, skip if not.

## Assets
Reference file: `../samkirk-v3/.github/workflows/ci.yml` (lines 88-152)

---
*Source: User asked to carry over CI/CD pipeline from samkirk-v3; confirmed after side-by-side comparison.*
