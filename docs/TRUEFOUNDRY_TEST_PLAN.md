# Photo Fun - Initial Test Plan (Option A: TrueFoundry with Custom Metadata)

This test plan is for the **first run** with **Option A** (TrueFoundry AI Gateway + custom metadata, Gemini API key commented out) as described in `docs/TRUEFOUNDRY_SETUP.md`.

---

## 1. References

| Document | Purpose |
|----------|---------|
| `docs/Prompts.md` | Project scope: AI photo editing, TrueFoundry integration, dual API support, default image, custom metadata |
| `docs/TRUEFOUNDRY_SETUP.md` | Option A: `TRUEFOUNDRY_METADATA_PROJECT_ID`; Option B: `TRUEFOUNDRY_PROJECT_ID` |
| `docs/TRUEFOUNDRY_SETUP.md` Step 2 | **Option A (Access menu)** for creating the TrueFoundry Personal Access Token |

---

## 2. Pre-Test: Option A Setup Verification

### 2.1 `.env.local` (Option A, Gemini commented out)

`.env.local` should look like this. **No `VITE_` prefix** - `vite.config.ts` maps these into `import.meta.env`:

```bash
# --- Gemini (commented out for Option A) ---
# GEMINI_API_KEY=your_gemini_key

# --- TrueFoundry (required for Option A) ---
TRUEFOUNDRY_BASE_URL=https://api.truefoundry.com
TRUEFOUNDRY_API_KEY=<your_pat_from_Access_menu>
TRUEFOUNDRY_MODEL=sak-consulting:google-gemini:google-gemini

# --- Option A: Custom metadata (recommended) ---
TRUEFOUNDRY_METADATA_PROJECT_ID=photo-fun-app
```

Checklist:

- [ ] `GEMINI_API_KEY` is commented out (or absent).
- [ ] `TRUEFOUNDRY_BASE_URL` is set (e.g. `https://api.truefoundry.com` or `https://sak-consulting.api.truefoundry.com` if you use the workspace URL).
- [ ] `TRUEFOUNDRY_API_KEY` is a valid Personal Access Token from **Access -> New Personal Access Token** (Option A in the setup doc).
- [ ] `TRUEFOUNDRY_MODEL` is set to `sak-consulting:google-gemini:google-gemini` (or your actual model id from AI Gateway -> Models).
- [ ] `TRUEFOUNDRY_METADATA_PROJECT_ID` is set (e.g. `photo-fun-app`). This drives the `X-TFY-METADATA: {"project_id":"photo-fun-app"}` header.

Do **not** set `TRUEFOUNDRY_PROJECT_ID` for Option A.

### 2.2 Code vs Option A

| Area | Status | Notes |
|------|--------|-------|
| **`vite.config.ts`** | OK | `loadEnv` + `define` expose `TRUEFOUNDRY_*` and `TRUEFOUNDRY_METADATA_PROJECT_ID` to the app. |
| **`services/truefoundryService.ts`** | OK | `getTrueFoundryConfig()` reads `VITE_TRUEFOUNDRY_*` / `process.env.TRUEFOUNDRY_*`; sends `X-TFY-METADATA` when `metadataProjectId` is set. |
| **`services/geminiService.ts`** | OK | Uses TrueFoundry when `TRUEFOUNDRY_BASE_URL` and `TRUEFOUNDRY_API_KEY` are set; never uses Gemini when `GEMINI_API_KEY` is commented out. |
| **`App.tsx` - `apiKeyVerified`** | Fixed | Now checks both `GEMINI_API_KEY` and TrueFoundry (`TRUEFOUNDRY_BASE_URL` + `TRUEFOUNDRY_API_KEY`). With Option A, `apiKeyVerified` is `true`. |
| **`App.tsx` - `handleSelectKey` alert** | Fixed | Alert now describes Option A (TrueFoundry) and Option B (Gemini) and points to `docs/TRUEFOUNDRY_SETUP.md`. |
| **`truefoundryService` - images/edits fallback** | Known | The fallback to `/v1/images/edits` uses `Content-Type: multipart/form-data` with a JSON body, which is invalid. Primary path is `/v1/chat/completions`; this only runs if chat returns no image/text. Acceptable for initial test; fix when/if that fallback is used. |

### 2.3 Code changes applied for Option A

- **`App.tsx` `apiKeyVerified`:** Updated to set `apiKeyVerified = true` when either `GEMINI_API_KEY` or TrueFoundry (`TRUEFOUNDRY_BASE_URL` + `TRUEFOUNDRY_API_KEY`) is configured.
- **`App.tsx` `handleSelectKey`:** Alert updated to describe Option A (TrueFoundry) and Option B (Gemini) and to reference `docs/TRUEFOUNDRY_SETUP.md`.

---

## 3. Environment and Servers

### 3.1 Dependencies and build

```bash
cd /Users/sam/Projects/photo-fun5
npm ci
npm run build
```

- [ ] `npm run build` completes with no errors.

### 3.2 Dev server

```bash
npm run dev
```

- [ ] Dev server starts (e.g. http://localhost:3000).
- [ ] No runtime errors in the terminal on startup.

### 3.3 Default image

- [ ] `public/images/default-portrait.jpg` exists.
- [ ] On first load, the app shows "Loading default image..." then the default portrait (no need to upload to start).

---

## 4. In-Browser Tests

### 4.1 Page load and UI

- [ ] Page loads without a blank screen.
- [ ] Header shows "Photo Fun" and "Secured" (and "Change Key" if wired).
- [ ] Default portrait appears in the preview area.
- [ ] Chat shows the initial model message (e.g. "Awesome photo! Select a style or type your request below.").
- [ ] Preset buttons (e.g. "Oil painting", "Watercolor") and the text input are visible and enabled.

### 4.2 Image editing via TrueFoundry (primary path)

These go through `editImageWithGemini` -> `editImageWithTrueFoundry` -> `POST /api/llm/api/inference/openai/v1/chat/completions` with `X-TFY-METADATA`.

**Test 4.2.1 - Preset**

1. Click a preset (e.g. "Oil painting").
2. Expect: "Transformation complete!" or model text; preview image updates.

- [ ] Request completes without error.
- [ ] `currentImage` in the preview updates (or a clear message if the model returns text only).
- [ ] No "Neither TrueFoundry nor Gemini API key is set" in the UI or console.

**Test 4.2.2 - Custom prompt**

1. Type a short prompt, e.g. "Make the background dark blue."
2. Send.

- [ ] Request completes; image or text response appears.
- [ ] No 401/403 in network tab for the TrueFoundry request.

**Test 4.2.3 - Network and headers**

1. Open DevTools -> Network.
2. Trigger an edit (preset or custom).
3. Find the request to `.../openai/v1/chat/completions`.

- [ ] `Authorization: Bearer <TRUEFOUNDRY_API_KEY>` is present.
- [ ] `X-TFY-METADATA: {"project_id":"photo-fun-app"}` (or your `TRUEFOUNDRY_METADATA_PROJECT_ID`) is present when that env var is set.
- [ ] `x-tfy-project-id` is **not** present (Option A only uses metadata).

### 4.3 Error behavior

**Test 4.3.1 - Invalid or revoked TrueFoundry key**

1. In `.env.local`, set `TRUEFOUNDRY_API_KEY` to an invalid value (or comment it out).
2. Restart dev server, reload the app, then trigger an edit.

- [ ] User sees a clear error (e.g. from `ERROR_MESSAGES.generic` or the thrown error).
- [ ] If the error is "Requested entity was not found" or similar, `apiKeyVerified` is set to `false` (no change to current behavior).

**Test 4.3.2 - Both Gemini and TrueFoundry "off"**

1. Comment out `TRUEFOUNDRY_BASE_URL` and `TRUEFOUNDRY_API_KEY` (and keep `GEMINI_API_KEY` commented).
2. Restart, reload, trigger an edit.

- [ ] Error: "Neither TrueFoundry nor Gemini API key is set. Please set TRUEFOUNDRY_BASE_URL and TRUEFOUNDRY_API_KEY, or GEMINI_API_KEY in .env.local" (or equivalent).

### 4.4 Other flows (non-TrueFoundry-specific)

- [ ] **Replace image:** "Replace Image" clears the current image and shows the uploader; upload works and edits can be run again.
- [ ] **Reset:** "Reset" restores the last `originalImage` in the preview.
- [ ] **Session limit:** After 10 edits in the session, the next request shows the quota message from `ERROR_MESSAGES.quota`.

---

## 5. TrueFoundry-Side Checks (Optional)

- [ ] In TrueFoundry: **AI Gateway -> Logs/Analytics**, requests show `metadata.project_id` = `photo-fun-app` (or your `TRUEFOUNDRY_METADATA_PROJECT_ID`).
- [ ] If budget limiting is configured with `budget_applies_per: ['metadata.project_id']`, usage is attributed to that project id.

---

## 6. Test Run Summary Template

| # | Test | Result (Pass / Fail / Skip) | Notes |
|---|------|-----------------------------|-------|
| 2.1 | `.env.local` Option A | | |
| 2.2 | Code vs Option A | | |
| 3.1 | `npm run build` | | |
| 3.2 | `npm run dev` | | |
| 3.3 | Default image on disk | | |
| 4.1 | Page load and UI | | |
| 4.2.1 | Edit via preset | | |
| 4.2.2 | Edit via custom prompt | | |
| 4.2.3 | `X-TFY-METADATA` in request | | |
| 4.3.1 | Invalid TrueFoundry key | | |
| 4.3.2 | No API keys | | |
| 4.4 | Replace, Reset, Quota | | |
| 5 | TrueFoundry analytics (optional) | | |

---

## 7. Post-Initial Test

- If the `/v1/images/edits` fallback is ever used, fix `Content-Type` and body format (or remove the fallback if the gateway does not support it).
