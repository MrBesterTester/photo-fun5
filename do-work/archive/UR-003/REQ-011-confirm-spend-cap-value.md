---
id: REQ-011
title: Confirm monthly spend cap value
status: completed
claimed_at: 2026-02-19T19:00:00Z
route: A
completed_at: 2026-02-19T19:02:00Z
created_at: 2026-02-19T18:00:00Z
user_request: UR-003
related: [REQ-006, REQ-008, REQ-012]
---

# Confirm Monthly Spend Cap Value

## What
Confirm that `MONTHLY_SPEND_CAP_CENTS` env var is set to an appropriate value in Vercel.

## Context
Default is $20/mo (2000 cents) as implemented in REQ-006/REQ-008. Verify this value is appropriate for production usage before REQ-012 (integration testing).

---
*Source: docs/SECURITY-comparison-report_2.md, Production Readiness Checklist item 4*

---

## Triage

**Route: A** - Simple

**Reasoning:** Verification task — confirm an env var value in Vercel. No code changes expected, just a check.

**Planning:** Not required

## Plan

**Planning not required** - Route A: Direct implementation

Rationale: Simple verification task. Check the env var value and confirm it's appropriate.

*Skipped by work action*

## Implementation Summary

- `MONTHLY_SPEND_CAP_CENTS` was not previously set as an explicit Vercel env var
- Code default in `api/image-edit.ts:63` falls back to `2000` (= $20/month)
- User confirmed $20/month is the appropriate value
- Set `MONTHLY_SPEND_CAP_CENTS=2000` explicitly in Vercel production environment for visibility
- Verified via `vercel env ls` — confirmed present

*Completed by work action (Route A)*

## Testing

**Tests run:** N/A — env var verification only, no code changes
**Result:** Verified via `vercel env ls` that the variable is set in production

*Verified by work action*
