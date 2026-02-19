---
id: REQ-002
title: "Add Input Validation with Zod"
status: pending
created_at: 2026-02-19T12:00:00Z
user_request: UR-001
related: [REQ-001, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007]
batch: "SECURITY-step-2"
source_step: "2"
source_doc: "docs/SECURITY-TODO.md"
blueprint_ref: "docs/SECURITY-BLUEPRINT.md"
model_hint: "Opus 4.5"
---

# Add Input Validation with Zod (Step 2)

## What
Install Zod and add schema-based input validation to `api/image-edit.ts`, replacing the existing null check with proper validation of imageBase64, prompt, and mimeType fields.

## Checklist
- [ ] 2.1 Install Zod (`npm install zod`)
- [ ] 2.2 Define request schema (imageBase64, prompt, mimeType)
- [ ] 2.3 Replace existing null check with `schema.safeParse()`
- [ ] 2.4 Return 400 with safe error message on validation failure
- [ ] 2.5 Validate: `npx tsc --noEmit` and `npm run build`

## Blueprint Guidance
**Requirement:** R4
**Model:** Opus 4.5 (backend logic)
**Files:** `api/image-edit.ts`, `package.json`

2.1. Install Zod: `npm install zod`
2.2. Define a request schema:
  - `imageBase64`: string, max length (e.g., 10MB base64 ≈ 13.3M chars)
  - `prompt`: string, min 1 char, max 1000 chars
  - `mimeType`: enum of allowed types (`image/jpeg`, `image/png`, `image/webp`, `image/gif`)
2.3. Replace the existing `!imageBase64 || !prompt` check with `schema.safeParse()`
2.4. Return 400 with a safe error message on validation failure (no internal details)
2.5. Validate: `npx tsc --noEmit`, `npm run build`

## Context
- **Document set**: SECURITY
- **Specification**: See docs/SECURITY-SPECIFICATION.md for full requirements (R4: Input Validation)
- **Model recommendation**: Opus 4.5 (advisory — use if your tool supports model selection)

## Dependencies
Should be done after Step 1 (REQ-001). The Zod schema will be extended in Step 4 (REQ-004) to include `captchaToken`.

---
*Source: docs/SECURITY-TODO.md, Step 2*
