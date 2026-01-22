---
name: "Implement Option B: Secure serverless API route"
overview: Refactor the app to use a serverless API route that keeps the Gemini API key server-side, matching the security document's architecture. This includes creating the API route, updating client code, removing API key exposure, and updating documentation.
todos:
  - id: "1"
    content: Create api/image-edit.ts serverless function with Gemini API calls and maxOutputTokens limit
    status: completed
  - id: "2"
    content: Update services/geminiService.ts to call API route instead of Gemini directly
    status: completed
  - id: "3"
    content: Remove API key exposure from vite.config.ts
    status: completed
  - id: "4"
    content: Update App.tsx apiKeyVerified logic for server-side architecture
    status: completed
  - id: "5"
    content: Update docs/security-gcp-vercel.md to match actual implementation
    status: completed
isProject: false
---

# Implement Option B: Secure Serverless API Route

## Overview

Refactor the app from client-side Gemini API calls to a serverless API route architecture. This keeps the API key secure on the server and enables Vercel WAF rate limiting as described in the security document.

## Implementation Steps

### 1. Create Serverless API Route

**File: `api/image-edit.ts`** (new file)

Create a Vercel serverless function that:

- Accepts POST requests with `{ imageBase64: string, prompt: string }`
- Reads `GEMINI_API_KEY` from server-side environment variables (not `VITE_*`)
- Calls Gemini API using `@google/genai` SDK
- Implements `maxOutputTokens` limit (512 tokens as document suggests)
- Uses `gemini-3-pro-image-preview` at 2K resolution (matching current implementation)
- Returns `{ image?: string, text?: string }`
- Handles errors and returns appropriate HTTP status codes

**Key implementation details:**

- Use `process.env.GEMINI_API_KEY` (server-side only)
- Add `maxOutputTokens: 512` to `generationConfig`
- Keep the enforcement prompt logic
- Parse base64 image data and mime type
- Return same response format as current `editImageWithGemini`

### 2. Update Client-Side Service

**File: `services/geminiService.ts`**

Update `editImageWithGemini` function to:

- Remove direct Gemini API calls
- Remove API key handling (no longer needed client-side)
- Call `/api/image-edit` endpoint via fetch
- Send POST request with `{ imageBase64, prompt }`
- Handle response and errors
- Keep same function signature for compatibility with `App.tsx`

**Remove:**

- `import { GoogleGenAI } from "@google/genai"`
- API key reading logic
- Direct Gemini SDK calls

**Add:**

- Fetch call to `/api/image-edit`
- Error handling for API route responses

### 3. Remove API Key from Client Exposure

**File: `vite.config.ts`**

Remove API key exposure:

- Remove `'import.meta.env.VITE_GEMINI_API_KEY'` from `define`
- Remove `'process.env.GEMINI_API_KEY'` from `define` (client-side)
- Keep only server-side env var handling (Vercel will handle this)

### 4. Update API Key Verification

**File: `App.tsx`**

Update `apiKeyVerified` logic:

- Change from checking for API key in env vars
- Instead, check if API route is available (e.g., call `/api/image-edit` with a test request, or simpler: just check if we're in a deployed environment)
- Alternative: Remove client-side check entirely, let API route return 401 if key is missing

**Simplest approach:** Remove the check or make it always true in production (API route will handle auth)

### 5. Update Security Document

**File: `docs/security-gcp-vercel.md`**

Update to match actual implementation:

- **Section 2.b**: Change endpoint from `/api/chat` to `/api/image-edit`
- **Section 3.a**: Update code example to:
  - Show actual model: `gemini-3-pro-image-preview`
  - Show image editing structure (not just chat)
  - Include `imageConfig` with `imageSize: '2K'`
  - Show `maxOutputTokens: 512` in `generationConfig`
- **Section 3.b**: Clarify that `GEMINI_API_KEY` is set in Vercel Project Settings (server-side), not in `.env.local` for client

### 6. Handle Chat Function (Optional)

**File: `services/geminiService.ts`**

The `chatWithGemini` function is currently unused (app only uses `editImageWithGemini`). Options:

- Leave it as-is (not called by app)
- Create `/api/chat` endpoint if needed later
- Remove it if not needed

**Recommendation:** Leave it for now, can be updated later if chat functionality is added.

## File Changes Summary

**New Files:**

- `api/image-edit.ts` - Serverless API route for image editing

**Modified Files:**

- `services/geminiService.ts` - Update to call API route instead of Gemini directly
- `vite.config.ts` - Remove API key exposure
- `App.tsx` - Update API key verification logic
- `docs/security-gcp-vercel.md` - Update to match implementation

## Testing Considerations

1. **Local Development:**

   - API route needs to work with Vite dev server
   - May need to configure Vite to proxy API routes or use Vercel CLI for local testing

2. **Production:**

   - API key must be set in Vercel Project Settings → Environment Variables
   - Verify API key is not in browser bundle
   - Test rate limiting works on `/api/image-edit` endpoint

3. **Backward Compatibility:**

   - Ensure existing functionality (image editing, error handling) still works
   - Response format should match current implementation

## Architecture Flow

**Before (Current - Insecure):**

```
Browser → geminiService.ts → Gemini API (with exposed key)
```

**After (Option B - Secure):**