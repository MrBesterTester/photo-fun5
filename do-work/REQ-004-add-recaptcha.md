---
id: REQ-004
title: "Add reCAPTCHA"
status: pending
created_at: 2026-02-19T12:00:00Z
user_request: UR-001
related: [REQ-001, REQ-002, REQ-003, REQ-005, REQ-006, REQ-007]
batch: "SECURITY-step-4"
source_step: "4"
source_doc: "docs/SECURITY-TODO.md"
blueprint_ref: "docs/SECURITY-BLUEPRINT.md"
model_hint: "Opus 4.5"
---

# Add reCAPTCHA (Step 4)

## What
Add Google reCAPTCHA v2 Checkbox to the frontend and server-side token verification in `api/image-edit.ts`, ensuring bots cannot call the Gemini API without proving they are human.

## Checklist
- [ ] 4.1 Register reCAPTCHA v2 site key in Google console
- [ ] 4.2 Configure domains (localhost, vercel.app, photo-fun.samkirk.com)
- [ ] 4.3 Add reCAPTCHA script tag to `index.html`
- [ ] 4.4 Add reCAPTCHA checkbox widget to UI
- [ ] 4.5 Capture token and include in API request payload
- [ ] 4.6 Add `RECAPTCHA_SECRET_KEY` to Vercel env vars and `.env.local`
- [ ] 4.7 Verify token server-side before calling Gemini
- [ ] 4.8 Reject missing/invalid tokens with 403
- [ ] 4.9 Update Zod schema to include `captchaToken`
- [ ] 4.10 Validate: `npx tsc --noEmit`, `npm run build`, manual test

## Blueprint Guidance
**Requirement:** R1
**Model:** Opus 4.5 (frontend + backend)
**Files:** `src/App.tsx` (or relevant component), `api/image-edit.ts`, `index.html`, `.env.local`

### 4a: Choose v2 vs v3

**Recommendation: v2 Checkbox.** Explicit user friction is a feature for gating expensive LLM calls. Simpler to implement (pass/fail, no score thresholds).

### 4b: Frontend

4b.1. Register a new reCAPTCHA v2 site key in Google reCAPTCHA console
4b.2. Configure domains: `localhost`, `photo-fun5.vercel.app`, `photo-fun.samkirk.com`
4b.3. Add the reCAPTCHA script tag to `index.html`
4b.4. Add the reCAPTCHA checkbox widget to the UI (before the "generate" button or equivalent)
4b.5. Capture the token and include it in the API request payload

### 4c: Backend

4c.1. Add `RECAPTCHA_SECRET_KEY` to Vercel environment variables
4c.2. Before calling Gemini, verify the token with Google's `siteverify` API
4c.3. Reject requests with missing/invalid/expired tokens (return 403)
4c.4. Update the Zod schema to include `captchaToken: z.string().min(1)`

### 4d: Validation

4d.1. `npx tsc --noEmit`, `npm run build`
4d.2. Manual test: submit without CAPTCHA → 403; submit with CAPTCHA → proceeds

## Context
- **Document set**: SECURITY
- **Specification**: See docs/SECURITY-SPECIFICATION.md for full requirements (R1: reCAPTCHA with Server-Side Verification)
- **Model recommendation**: Opus 4.5 (advisory — use if your tool supports model selection)

## Dependencies
Depends on Step 2 (REQ-002) for the Zod schema that will be extended with `captchaToken`. Items 4.1, 4.2, 4.6 require manual Google console and Vercel dashboard actions.

---
*Source: docs/SECURITY-TODO.md, Step 4*
