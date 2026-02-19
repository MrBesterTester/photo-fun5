---
id: UR-003
title: Production Readiness Checklist from Security Comparison Report
created_at: 2026-02-19T18:00:00Z
requests: [REQ-009, REQ-010, REQ-011]
word_count: 53
---

# Production Readiness Checklist from Security Comparison Report

## Summary

User requested capture of the Production Readiness Checklist from docs/SECURITY-comparison-report_2.md. These are env var configuration tasks that must be completed before REQ-007 (integration testing).

## Extracted Requests

| ID | Title | Summary |
|----|-------|---------|
| REQ-009 | Configure production reCAPTCHA | Replace test key + add domain to Google console allowlist |
| REQ-010 | Verify Upstash Redis credentials | Confirm UPSTASH_REDIS_REST_URL and TOKEN in Vercel env |
| REQ-011 | Confirm monthly spend cap value | Verify MONTHLY_SPEND_CAP_CENTS is appropriate |

## Notes

Item 5 from the checklist ("Test all error paths in staging") overlaps with existing REQ-007 (integration testing) and was not captured as a separate REQ.

## Full Verbatim Input

The check list in the Follow-Up in @docs/SECURITY-comparison-report_2.md .

Source checklist (from docs/SECURITY-comparison-report_2.md, "Production Readiness Checklist"):

- [ ] Replace reCAPTCHA test key with production key in Vercel env (`RECAPTCHA_SECRET_KEY`)
- [ ] Add production domain to Google reCAPTCHA console allowlist
- [ ] Verify Upstash Redis credentials in Vercel env (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`)
- [ ] Confirm `MONTHLY_SPEND_CAP_CENTS` value is appropriate
- [ ] Test all error paths in staging (invalid CAPTCHA -> 403, rate limit -> 429, spend cap -> 503)

---
*Captured: 2026-02-19T18:00:00Z*
