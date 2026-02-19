---
id: REQ-011
title: Confirm monthly spend cap value
status: pending
created_at: 2026-02-19T18:00:00Z
user_request: UR-003
related: [REQ-006, REQ-008, REQ-007]
---

# Confirm Monthly Spend Cap Value

## What
Confirm that `MONTHLY_SPEND_CAP_CENTS` env var is set to an appropriate value in Vercel.

## Context
Default is $20/mo (2000 cents) as implemented in REQ-006/REQ-008. Verify this value is appropriate for production usage before REQ-007 (integration testing).

---
*Source: docs/SECURITY-comparison-report_2.md, Production Readiness Checklist item 4*
