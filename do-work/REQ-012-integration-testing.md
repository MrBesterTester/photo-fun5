---
id: REQ-012
title: "Integration Testing and Validation"
status: pending
created_at: 2026-02-19T12:00:00Z
user_request: UR-001
related: [REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-009, REQ-010, REQ-011]
batch: "SECURITY-step-7"
source_step: "7"
source_doc: "docs/SECURITY-TODO.md"
blueprint_ref: "docs/SECURITY-BLUEPRINT.md"
model_hint: "Gemini 3 Pro"
---

# Integration Testing and Validation (Step 7)

## What
Perform full end-to-end testing of the entire security protection flow, verifying that all protections (CAPTCHA, rate limiting, input validation, spend cap, debug removal, gitleaks) work correctly together.

## Checklist
- [ ] 7.1 Test: no CAPTCHA → 403
- [ ] 7.2 Test: invalid CAPTCHA → 403
- [ ] 7.3 Test: valid CAPTCHA, normal request → success
- [ ] 7.4 Test: exceed rate limit → 429
- [ ] 7.5 Test: invalid input (bad MIME, oversized) → 400
- [ ] 7.6 Verify debug info removed from all responses
- [ ] 7.7 Verify gitleaks runs in CI
- [ ] 7.8 `npx tsc --noEmit` and `npm run build` pass
- [ ] 7.9 Deploy to preview and test on Vercel

## Blueprint Guidance
**Model:** Gemini 3 Pro (debugging/visual/E2E)

7.1. Full manual test of the protection flow:
  - No CAPTCHA → 403
  - Invalid CAPTCHA → 403
  - Valid CAPTCHA, normal request → success
  - Exceed rate limit → 429
  - Invalid input (bad MIME type, oversized payload) → 400
7.2. Verify debug info is gone from all responses
7.3. Verify gitleaks runs in CI
7.4. `npx tsc --noEmit` and `npm run build` pass
7.5. Deploy to preview, test on Vercel

## Context
- **Document set**: SECURITY
- **Specification**: See docs/SECURITY-SPECIFICATION.md for full requirements (Success Criteria section)
- **Model recommendation**: Gemini 3 Pro (advisory — use if your tool supports model selection)

## Dependencies
Depends on ALL previous steps (REQ-001 through REQ-006). This is the final validation step and should only be run after all protections are implemented.

---
*Source: docs/SECURITY-TODO.md, Step 7*
