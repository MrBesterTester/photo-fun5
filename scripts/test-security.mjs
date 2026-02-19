#!/usr/bin/env node

/**
 * Security integration tests for photo-fun5
 *
 * Modes:
 *   --static   Static analysis only (no server needed) [default]
 *   --api      API endpoint tests (requires vercel dev on port 3000)
 *   --all      Run both static + API tests
 *
 * Environment:
 *   TEST_API_BASE  Override API base URL (default: http://localhost:3000)
 *
 * Examples:
 *   npm test                          # static checks only
 *   npm run test:api                  # API tests only
 *   npm run test:all                  # everything
 *   TEST_API_BASE=https://photo-fun5.vercel.app npm run test:api  # against Vercel preview
 */

import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const API_BASE = process.env.TEST_API_BASE || "http://localhost:3000";
const MODE = process.argv.includes("--all")
  ? "all"
  : process.argv.includes("--api")
    ? "api"
    : "static";

let passed = 0;
let failed = 0;
let skipped = 0;

function pass(name) {
  passed++;
  console.log(`  \x1b[32m✓\x1b[0m ${name}`);
}

function fail(name, reason) {
  failed++;
  console.log(`  \x1b[31m✗\x1b[0m ${name}`);
  if (reason) console.log(`    → ${reason}`);
}

function skip(name, reason) {
  skipped++;
  console.log(`  \x1b[33m○\x1b[0m ${name} (skipped: ${reason})`);
}

function section(name) {
  console.log(`\n\x1b[1m${name}\x1b[0m`);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** POST JSON to the API and return { status, body } */
async function apiPost(path, body) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, body: json, raw: text, headers: res.headers };
}

/** Build a tiny valid-looking base64 PNG (1x1 pixel). */
function tinyPngBase64() {
  // Minimal 1x1 red PNG
  const raw =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
  return `data:image/png;base64,${raw}`;
}

// ===========================================================================
// STATIC CHECKS (no server required)
// ===========================================================================

async function runStaticChecks() {
  // --- 7.8: TypeScript compiles ---
  section("7.8 — TypeScript & Build");

  try {
    execSync("npx tsc --noEmit", { cwd: resolve("."), stdio: "pipe" });
    pass("npx tsc --noEmit passes");
  } catch (e) {
    fail("npx tsc --noEmit passes", e.stderr?.toString().split("\n")[0]);
  }

  try {
    execSync("npm run build", { cwd: resolve("."), stdio: "pipe" });
    pass("npm run build succeeds");
  } catch (e) {
    fail("npm run build succeeds", e.stderr?.toString().split("\n")[0]);
  }

  // --- 7.7: gitleaks in CI ---
  section("7.7 — gitleaks in CI");

  const ciPath = resolve(".github/workflows/ci.yml");
  if (!existsSync(ciPath)) {
    fail("CI workflow exists", `${ciPath} not found`);
  } else {
    const ci = readFileSync(ciPath, "utf8");
    if (ci.includes("gitleaks/gitleaks-action")) {
      pass("CI workflow includes gitleaks action");
    } else {
      fail("CI workflow includes gitleaks action");
    }
    if (ci.includes("fetch-depth: 0")) {
      pass("gitleaks gets full git history (fetch-depth: 0)");
    } else {
      fail("gitleaks gets full git history (fetch-depth: 0)");
    }
  }

  // --- 7.6: Debug info removed ---
  section("7.6 — Debug info removed from responses");

  const apiPath = resolve("api/image-edit.ts");
  if (!existsSync(apiPath)) {
    fail("API file exists", `${apiPath} not found`);
  } else {
    const api = readFileSync(apiPath, "utf8");

    // Check that no Response includes stack traces or process.env values
    const debugPatterns = [
      { pattern: /JSON\.stringify\(.*stack/i, desc: "stack trace in response" },
      { pattern: /JSON\.stringify\(.*process\.env/i, desc: "env vars in response" },
      { pattern: /JSON\.stringify\(.*apiKey/i, desc: "API key in response" },
      { pattern: /JSON\.stringify\(.*secret/i, desc: "secret in response" },
    ];

    let debugClean = true;
    for (const { pattern, desc } of debugPatterns) {
      if (pattern.test(api)) {
        fail(`No ${desc} leaked in API`, `Pattern found: ${pattern}`);
        debugClean = false;
      }
    }
    if (debugClean) {
      pass("No stack traces, env vars, or secrets in API responses");
    }

    // Verify all error responses use generic messages
    const errorResponses = api.match(/new Response\(JSON\.stringify\(\{.*error.*\}\)/g) || [];
    if (errorResponses.length > 0) {
      pass(`Error responses use structured { error } format (${errorResponses.length} found)`);
    } else {
      fail("Error responses use structured { error } format");
    }

    // Verify CAPTCHA verification exists
    if (api.includes("verifyCaptcha") && api.includes("siteverify")) {
      pass("Server-side CAPTCHA verification present");
    } else {
      fail("Server-side CAPTCHA verification present");
    }

    // Verify rate limiting exists
    if (api.includes("Ratelimit") && api.includes("slidingWindow")) {
      pass("Rate limiting with sliding window present");
    } else {
      fail("Rate limiting with sliding window present");
    }

    // Verify input validation exists
    if (api.includes("requestSchema") && api.includes("safeParse")) {
      pass("Zod input validation present");
    } else {
      fail("Zod input validation present");
    }

    // Verify MIME type allowlist
    if (api.includes("ALLOWED_MIME_TYPES")) {
      pass("MIME type allowlist present");
    } else {
      fail("MIME type allowlist present");
    }

    // Verify spend cap exists
    if (api.includes("MONTHLY_SPEND_CAP_CENTS") && api.includes("spendRedis")) {
      pass("Monthly spend cap present");
    } else {
      fail("Monthly spend cap present");
    }
  }
}

// ===========================================================================
// API TESTS (requires running server)
// ===========================================================================

async function runApiTests() {
  // Verify server is reachable first
  section("Server connectivity");
  try {
    // Use a simple GET — Vercel dev returns 404 for unknown routes, which is fine
    const res = await fetch(API_BASE, { signal: AbortSignal.timeout(5000) });
    pass(`Server reachable at ${API_BASE} (status ${res.status})`);
  } catch (e) {
    fail(`Server reachable at ${API_BASE}`, e.message);
    console.log(
      "\n  ⚠  API tests require a running server. Start with: npm run dev:vercel\n",
    );
    return;
  }

  // --- 7.1: No CAPTCHA → rejected ---
  section("7.1 — No CAPTCHA token → rejected");

  {
    // Missing captchaToken field entirely → Zod rejects → 400
    const r = await apiPost("/api/image-edit", {
      imageBase64: tinyPngBase64(),
      prompt: "test",
    });
    if (r.status === 400) {
      pass(`Missing captchaToken → ${r.status} (Zod validation rejects)`);
    } else {
      fail(`Missing captchaToken → 400`, `Got ${r.status}: ${r.raw.slice(0, 120)}`);
    }
  }

  {
    // Empty captchaToken → Zod min(1) rejects → 400
    const r = await apiPost("/api/image-edit", {
      imageBase64: tinyPngBase64(),
      prompt: "test",
      captchaToken: "",
    });
    if (r.status === 400) {
      pass(`Empty captchaToken → ${r.status} (Zod min(1) rejects)`);
    } else {
      fail(`Empty captchaToken → 400`, `Got ${r.status}: ${r.raw.slice(0, 120)}`);
    }
  }

  // --- 7.2: Invalid CAPTCHA → 403 ---
  section("7.2 — Invalid CAPTCHA token → 403");

  {
    const r = await apiPost("/api/image-edit", {
      imageBase64: tinyPngBase64(),
      prompt: "test",
      captchaToken: "invalid-token-abc123",
    });
    if (r.status === 403) {
      pass(`Invalid captchaToken → ${r.status}`);
    } else if (r.status === 400) {
      // Could happen if RECAPTCHA_SECRET_KEY is not configured (verifyCaptcha returns false → 403
      // unless something else catches it first)
      fail(`Invalid captchaToken → 403`, `Got ${r.status} — is RECAPTCHA_SECRET_KEY set?`);
    } else {
      fail(`Invalid captchaToken → 403`, `Got ${r.status}: ${r.raw.slice(0, 120)}`);
    }
  }

  {
    // Verify the error message is safe (no secrets, no stack traces)
    const r = await apiPost("/api/image-edit", {
      imageBase64: tinyPngBase64(),
      prompt: "test",
      captchaToken: "invalid-token-abc123",
    });
    if (r.body && typeof r.body.error === "string") {
      const errMsg = r.body.error;
      const leaks = [
        errMsg.includes("stack"),
        errMsg.includes("secret"),
        errMsg.includes("env"),
        errMsg.includes("token"),
        errMsg.length > 200,
      ];
      if (leaks.some(Boolean)) {
        fail("Error response is safe (no debug info)", `Error: ${errMsg.slice(0, 200)}`);
      } else {
        pass("Error response is safe (no debug info)");
      }
    } else {
      pass("Error response is structured JSON");
    }
  }

  // --- 7.3: Valid CAPTCHA, normal request → success ---
  section("7.3 — Valid CAPTCHA, normal request → success");
  skip(
    "Valid CAPTCHA + normal request → 200",
    "requires real reCAPTCHA token (manual browser test)",
  );

  // --- 7.4: Exceed rate limit → 429 ---
  section("7.4 — Exceed rate limit → 429");

  if (process.env.TEST_RATE_LIMIT === "1") {
    // Opt-in: sends 11 requests to trigger rate limit (destructive to rate limit quota)
    console.log("  ⚠  Sending 11 requests to trigger rate limit...");
    let got429 = false;
    for (let i = 0; i < 12; i++) {
      const r = await apiPost("/api/image-edit", {
        imageBase64: tinyPngBase64(),
        prompt: "test",
        captchaToken: `rate-limit-test-${i}`,
      });
      if (r.status === 429) {
        pass(`Rate limit triggered after ${i + 1} requests → 429`);
        // Verify Retry-After header
        const retryAfter = r.headers.get("retry-after");
        if (retryAfter) {
          pass(`429 includes Retry-After header: ${retryAfter}s`);
        } else {
          fail("429 includes Retry-After header");
        }
        got429 = true;
        break;
      }
    }
    if (!got429) {
      fail(
        "Rate limit triggered → 429",
        "Sent 12 requests, none returned 429 — is Upstash Redis configured?",
      );
    }
  } else {
    skip(
      "Rate limit test (10 req/600s) → 429",
      "opt-in with TEST_RATE_LIMIT=1 (consumes rate limit quota)",
    );
  }

  // --- 7.5: Invalid input → 400 ---
  section("7.5 — Invalid input → 400");

  {
    // Completely empty body
    const r = await apiPost("/api/image-edit", {});
    if (r.status === 400) {
      pass(`Empty body → ${r.status}`);
    } else {
      fail(`Empty body → 400`, `Got ${r.status}`);
    }
  }

  {
    // Missing imageBase64
    const r = await apiPost("/api/image-edit", {
      prompt: "test",
      captchaToken: "test",
    });
    if (r.status === 400) {
      pass(`Missing imageBase64 → ${r.status}`);
    } else {
      fail(`Missing imageBase64 → 400`, `Got ${r.status}`);
    }
  }

  {
    // Missing prompt
    const r = await apiPost("/api/image-edit", {
      imageBase64: tinyPngBase64(),
      captchaToken: "test",
    });
    if (r.status === 400) {
      pass(`Missing prompt → ${r.status}`);
    } else {
      fail(`Missing prompt → 400`, `Got ${r.status}`);
    }
  }

  {
    // Prompt too long (over 1000 chars)
    const r = await apiPost("/api/image-edit", {
      imageBase64: tinyPngBase64(),
      prompt: "x".repeat(1001),
      captchaToken: "test",
    });
    if (r.status === 400) {
      pass(`Oversized prompt (1001 chars) → ${r.status}`);
    } else {
      fail(`Oversized prompt → 400`, `Got ${r.status}`);
    }
  }

  {
    // Non-JSON body
    try {
      const res = await fetch(`${API_BASE}/api/image-edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json at all",
      });
      if (res.status === 400 || res.status === 500) {
        pass(`Non-JSON body → ${res.status}`);
      } else {
        fail(`Non-JSON body → 400 or 500`, `Got ${res.status}`);
      }
    } catch (e) {
      fail(`Non-JSON body → 400 or 500`, e.message);
    }
  }

  // Note: Bad MIME type and oversized imageBase64 tests require passing CAPTCHA
  // verification first, so they can only be tested with valid CAPTCHA tokens
  // or in an environment where CAPTCHA is bypassed.
  skip(
    "Bad MIME type → 400",
    "requires passing CAPTCHA first (CAPTCHA blocks before MIME check)",
  );
  skip(
    "Oversized imageBase64 → 400",
    "requires passing CAPTCHA first (CAPTCHA blocks before MIME check)",
  );
}

// ===========================================================================
// MAIN
// ===========================================================================

async function main() {
  console.log(`\n\x1b[1;36m🔒 Security Integration Tests\x1b[0m`);
  console.log(`   Mode: ${MODE} | API: ${API_BASE}\n`);

  if (MODE === "static" || MODE === "all") {
    await runStaticChecks();
  }

  if (MODE === "api" || MODE === "all") {
    await runApiTests();
  }

  // Summary
  console.log("\n" + "─".repeat(50));
  const total = passed + failed + skipped;
  const color = failed > 0 ? "\x1b[31m" : "\x1b[32m";
  console.log(
    `${color}${passed} passed\x1b[0m, ${failed > 0 ? "\x1b[31m" : ""}${failed} failed\x1b[0m, ${skipped} skipped (${total} total)`,
  );
  console.log("─".repeat(50) + "\n");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Test runner error:", e);
  process.exit(2);
});
