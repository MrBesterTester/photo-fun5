---
id: REQ-006
title: "Add Hard Spend Cap"
status: pending
created_at: 2026-02-19T12:00:00Z
user_request: UR-001
related: [REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-007]
batch: "SECURITY-step-6"
source_step: "6"
source_doc: "docs/SECURITY-TODO.md"
blueprint_ref: "docs/SECURITY-BLUEPRINT.md"
model_hint: "Opus 4.5"
---

# Add Hard Spend Cap (Step 6)

## What
Implement a monthly spend cap enforced in code using Upstash Redis, tracking cumulative Gemini API usage and refusing requests with 503 when the cap is exceeded.

## Checklist
- [ ] 6.1 Define `MONTHLY_SPEND_CAP_CENTS` env var
- [ ] 6.2 Increment spend counter in Upstash Redis after each Gemini call
- [ ] 6.3 Check spend cap before calling Gemini, return 503 when exceeded
- [ ] 6.4 Set TTL on spend keys for auto-expiry
- [ ] 6.5 Add env var to Vercel
- [ ] 6.6 Validate: `npx tsc --noEmit`, `npm run build`

## Blueprint Guidance
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

## Context
- **Document set**: SECURITY
- **Specification**: See docs/SECURITY-SPECIFICATION.md for full requirements (R3: Hard Spend Cap)
- **Model recommendation**: Opus 4.5 (advisory — use if your tool supports model selection)

## Dependencies
Depends on Step 5 (REQ-005) — reuses the same Upstash Redis instance and client setup. Item 6.5 requires Vercel dashboard action.

---
*Source: docs/SECURITY-TODO.md, Step 6*
