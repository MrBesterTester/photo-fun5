---
id: REQ-001
title: "Remove Debug Info Leak"
status: completed
created_at: 2026-02-19T12:00:00Z
claimed_at: 2026-02-19T18:00:00Z
route: A
completed_at: 2026-02-19T18:01:00Z
user_request: UR-001
related: [REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007]
batch: "SECURITY-step-1"
source_step: "1"
source_doc: "docs/SECURITY-TODO.md"
blueprint_ref: "docs/SECURITY-BLUEPRINT.md"
model_hint: "Sonnet 4"
---

# Remove Debug Info Leak (Step 1)

## What
Remove the `debug` object from all API response paths in `api/image-edit.ts` to prevent leaking internal details in production and preview deployments.

## Checklist
- [ ] 1.1 Find the `debug` object in `api/image-edit.ts` response
- [ ] 1.2 Remove debug info from all response paths
- [ ] 1.3 Validate: `npm run build` passes, no `debug` in responses

## Blueprint Guidance
**Requirement:** R5
**Model:** Sonnet 4 (quick fix)
**Files:** `api/image-edit.ts`

1.1. Find the `debug` object in the API response
1.2. Remove it entirely from all response paths (not just gate behind `NODE_ENV`)
1.3. Validate: `npm run build`, confirm no `debug` field in any response

**Why first:** Smallest change, immediate security improvement, zero dependencies.

## Context
- **Document set**: SECURITY
- **Specification**: See docs/SECURITY-SPECIFICATION.md for full requirements (R5: Remove Debug Info Leak)
- **Model recommendation**: Sonnet 4 (advisory — use if your tool supports model selection)

## Dependencies
No dependencies. This is the simplest, most independent step and should be done first.

---
*Source: docs/SECURITY-TODO.md, Step 1*

---

## Triage

**Route: A** - Simple

**Reasoning:** Single file explicitly named (`api/image-edit.ts`), clear task (remove `debug` object from responses). No architectural decisions needed.

**Planning:** Not required

## Plan

**Planning not required** - Route A: Direct implementation

Rationale: Simple removal of debug info from a single named file. Clear scope, no dependencies.

*Skipped by work action*

## Implementation Summary

- Removed the `debug` variable construction (diagnostic fields object) from `api/image-edit.ts`
- Removed `debug` field from the error response JSON body (was conditionally exposed in non-production)
- Kept server-side `console.warn` for diagnostics (not exposed to clients), trimmed overly revealing fields

*Completed by work action (Route A)*

## Testing

**Tests run:** `npm run build` + `npx tsc --noEmit`
**Result:** Both passing. No `debug` field found in grep of `api/image-edit.ts`.

**No testing infrastructure detected** — TypeScript type-check and build are the primary gates per project conventions.

*Verified by work action*
