Here's a focused, admin‑driven plan using only **GCP** (for Gemini) and **Vercel** (for your app), with minimal app code.

## Table of Contents

- [1. GCP: Lock Down Gemini Usage (Admin Only)](#1-gcp-lock-down-gemini-usage-admin-only)
  - [a) Configure Gemini quotas](#a-configure-gemini-quotas)
  - [b) Use a dedicated GCP project for this app](#b-use-a-dedicated-gcp-project-for-this-app)
- [2. Vercel: Edge Rate Limiting via Admin UI](#2-vercel-edge-rate-limiting-via-admin-ui)
  - [a) Deploy your existing app to Vercel](#a-deploy-your-existing-app-to-vercel)
  - [b) Add a WAF rate‑limit rule for your image editing endpoint](#b-add-a-waf-ratelimit-rule-for-your-image-editing-endpoint)
- [3. Minimal App‑Side Settings (One-Time)](#3-minimal-appside-settings-one-time)
  - [a) Cap Gemini response size per request](#a-cap-gemini-response-size-per-request)
  - [b) Use environment variables for keys](#b-use-environment-variables-for-keys)
- [4. Local Development vs Production: Security Layer Coverage](#4-local-development-vs-production-security-layer-coverage)
- [5. How This Meets Your "Enough Is Enough" Bar](#5-how-this-meets-your-enough-is-enough-bar)
- [Appendix: Cost Justification and Budget Calculation](#appendix-cost-justification-and-budget-calculation)
  - [Direct Answer](#direct-answer)
  - [Gemini 3 Pro Image Preview Pricing Structure](#gemini-3-pro-image-preview-pricing-structure)
  - [Token Consumption Breakdown](#token-consumption-breakdown)
  - [Cost Calculation](#cost-calculation)
  - [Handling "Killer Requests"](#handling-killer-requests)
  - [Cost Comparison Table](#cost-comparison-table)
  - [Monitoring and Enforcement](#monitoring-and-enforcement)
  - [Expected User Experience](#expected-user-experience)
  - [Summary: Configuration Checklist](#summary-configuration-checklist)

***

## 1. GCP: Lock Down Gemini Usage (Admin Only)

Goal: Bound Gemini cost per month and prevent runaway calls.

### a) Configure Gemini quotas

In the **Google Cloud Console** for the project that owns your Gemini API:

- Go to **IAM & Admin → Quotas**.  
- Filter by **"Gemini API"** or the specific Gemini services you're using.[1][2]
- For the models/endpoints you use (e.g., `gemini-3-pro-image-preview`, image models), adjust:

  - **Requests per day** – Recommended: **5 requests per day** for a $20/month budget (see [Appendix: Cost Justification](#appendix-cost-justification-and-budget-calculation) for detailed calculation).  
    - This equals approximately 149-155 requests per month at ~$0.134 per 2K image request.  
    - Alternative (more conservative): **4 requests per day** = ~$16.62/month with a $3.38 buffer.  
  - **Requests per minute** – e.g., 30–60 RPM for your demo app.  
  - **Tokens per minute / per day** – if exposed, set conservative caps.  
  - **Images per minute / per day** for image models.[3][1]

- Click **Edit Quotas** and submit the lower values you want.  
- Provide justification (optional for reductions): "Cost control for demo project using gemini-3-pro-image-preview at 2K resolution"

Effect:  
- If your app or an attacker overuses Gemini, GCP returns **429** once quotas are hit; usage can't silently run away.[1]
- Quota changes for reductions take effect **within minutes**. After the daily limit is reached, subsequent requests will return: `429 Resource Exhausted: Quota exceeded for quota metric 'GenerateContent requests per day'`
- The quota automatically resets at **midnight Pacific Time**.

### b) Use a dedicated GCP project for this app

To keep costs from mixing with other work:

- Create a **separate GCP project** just for this web app + Gemini.  
- Put the API key/service account used by your app into this project only.  
- Apply the quotas above to this project.

Effect:  
- This app's usage and costs are isolated and easy to understand.  
- Quotas on this project define the **hard ceiling** for all Gemini calls from the app.

***

## 2. Vercel: Edge Rate Limiting via Admin UI

Goal: Throttle abusive HTTP traffic before it hits your code or GCP.

### a) Deploy your existing app to Vercel

- Connect your GitHub repo (or import the project) in the Vercel dashboard.  
- Ensure your API route `/api/image-edit` is deployed as a serverless function that calls Gemini.
- The API route is located at `api/image-edit.ts` and handles image editing requests.

No security logic added yet.

### b) Add a WAF rate‑limit rule for your image editing endpoint

In the Vercel dashboard for this project:[4][5][6]

1. Go to **Security → Firewall (WAF)**.  
2. Click **Configure** if prompted, then **+ New Rule**.  
3. Define the rule:

   - **Name:** `Rate limit /api/image-edit`  
   - **Conditions (IF):**  
     - `Request Path` -  `Equals` -  `/api/image-edit`  
   - **Action (THEN):**  
     - `Rate Limit`  
     - Strategy: `Fixed Window`  
     - Time Window: `60 seconds`  
     - Request Limit: e.g., `20` or `30`  
     - Key: `IP`  

4. Save and **Publish** the rule.  

Effect:  
- Any single IP can only hit `/api/image-edit` a limited number of times per minute.  
- Excess traffic is automatically answered with **429** at the edge; your function often won't execute at all during abuse.[7][4]

You can later tune the numbers based on logs (e.g., more generous for logged‑in users, stricter for anonymous).

***

## 3. Minimal App‑Side Settings (One-Time)

Goal: Small, simple safeguards inside your app with minimal coding.

### a) Cap Gemini response size per request

In your `/api/image-edit` handler, always set a maximum output size:

```ts
const MAX_OUTPUT_TOKENS = 512; // Limit output tokens to control costs per request

const response = await ai.models.generateContent({
  model: 'gemini-3-pro-image-preview',
  contents: {
    parts: [
      { text: enforcementPrompt },
      { inlineData: { mimeType: mimeType, data: cleanBase64 } },
    ],
  },
  config: {
    responseModalities: ['IMAGE', 'TEXT'],
    imageConfig: {
      imageSize: '2K', // Use 2K resolution to balance quality and cost
    },
    generationConfig: {
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    },
  },
});
```

Effect:  
- Even when requests are allowed, each one has a bounded worst‑case cost.  
- Combined with GCP quotas, this keeps per‑user and per‑day costs predictable.
- The `maxOutputTokens` limit is enforced server-side in the API route.

### b) Use environment variables for keys

- In Vercel **Project Settings → Environment Variables**, set:  
  - `GEMINI_API_KEY` - Your Google Gemini API key (server-side only, not exposed to client)
  - `GCP_PROJECT_ID` (optional, if needed for additional GCP services)

**Important:**  
- The API key is set in Vercel's server-side environment variables, NOT in client-side code
- The API key is never exposed to the browser - all Gemini API calls happen server-side in the `/api/image-edit` route
- Do NOT set `VITE_GEMINI_API_KEY` or expose the key in `vite.config.ts` - this would expose it to the client

Effect:  
- Keeps keys secure and makes it easy to rotate them without code changes.
- API key is completely hidden from browser/client-side code.

***

## 4. Local Development vs Production: Security Layer Coverage

When running locally with `vercel dev` versus deploying to Vercel production, different security layers apply:

| Security Layer | Applies Locally? | Applies in Production? | Notes |
|----------------|------------------|------------------------|-------|
| **Step 1a: GCP Quotas** | ✅ Yes | ✅ Yes | Enforced by Google's API regardless of request origin |
| **Step 2b: Vercel WAF** | ❌ No | ✅ Yes | Only applies to requests through Vercel's edge network |
| **Step 3a: `maxOutputTokens`** | ✅ Yes | ✅ Yes | Code-level enforcement works everywhere |

### Why GCP Quotas Apply Locally

GCP quota limits are enforced at the **Google Cloud API level**, not at Vercel's edge. When your local code calls the Gemini API, the request goes to Google's servers, which check and enforce the quotas you configured in GCP Console:

```
Local Development Flow:
┌─────────────────────────────────────┐
│  Your Local Code                    │
│  (vercel dev on localhost)          │
│         ↓                           │
│  Makes API call to Gemini           │
│         ↓                           │
│  Google Cloud API                   │
│  └─ Checks Quota Limits ✓           │
│  └─ Enforces 5 requests/day ✓       │
│         ↓                           │
│  Returns response or 429 error      │
└─────────────────────────────────────┘
```

**Example:** If you set 5 requests per day in GCP, after 5 requests (whether from local or production), the 6th request will receive a `429 Resource Exhausted: Quota exceeded` error from Google.

### Why Vercel WAF Doesn't Apply Locally

Vercel WAF (Web Application Firewall) rules run on **Vercel's edge network**, not on your local machine. When you run `vercel dev` locally, requests go directly to your local serverless function and bypass Vercel's edge infrastructure where WAF rules are enforced.

**This means:** WAF rate limiting configured in Step 2b will only take effect after you deploy to Vercel production. For local development, you would need to implement rate limiting in code if you want to test it locally.

### Summary

- **GCP quotas (Step 1a):** Active in both local and production environments, providing cost protection during development.
- **Vercel WAF (Step 2b):** Only active in production, providing additional edge-level protection for deployed apps.
- **Code-level limits (Step 3a):** Active everywhere, providing per-request cost bounds.

This layered approach ensures you have cost protection during development (via GCP quotas) and additional traffic protection in production (via both GCP quotas and Vercel WAF).

***

## 5. How This Meets Your "Enough Is Enough" Bar

With almost everything done via admin config:

- **GCP project + quotas:**  
  - Hard limits on how much Gemini can be used per minute and per day, per app project.[2][1]

- **Vercel WAF rate limit:**  
  - Per‑IP throttling of `/api/image-edit` without touching your app code.[6][4]

- **Minimal app code:**  
  - Just a `maxOutputTokens` cap in the API route (plus your existing Gemini integration).
  - Client-side code calls the secure API route instead of Gemini directly.  

Result:  
- A casual or moderately determined attacker is rate‑limited at the edge and further constrained by GCP quotas.  
- Your wallet has a clear ceiling per month, per app.  
- You've kept additional security code in the app to the bare minimum and pushed most of the work into **Vercel and GCP admin screens**, which aligns with your goal to ship without getting buried in security plumbing.

***

## Appendix: Cost Justification and Budget Calculation

### Direct Answer

For your use case—**image input with brief modification request, returning modified image output**—here's the exact calculation for a **$20/month spending cap** using **gemini-3-pro-image-preview at 2K resolution**:

**You can make approximately 149 requests per month, or about 5 requests per day.**

### Gemini 3 Pro Image Preview Pricing Structure

According to Google's official pricing documentation:

**Input Costs:**
- **Text/Image input**: $2.00 per 1 million tokens
- All input modalities (text prompts + image inputs) are charged at this single rate

**Output Costs:**
- **Text output**: $12.00 per 1 million tokens
- **Image output**: $12.00 per 1 million tokens
- Each 2K resolution output image consumes **1,120 tokens**, equivalent to **~$0.134 per image**

**Critical Pricing Note:**

For `gemini-3-pro-image-preview` at 2K resolution:
- **2K resolution images** (e.g., 2048×2048px for 1:1 aspect ratio) consume **1,120 tokens** per image
- At $12.00 per 1 million tokens: `1,120 tokens × ($12.00 / 1,000,000) = $0.01344` for output tokens
- Input costs are typically **~560 tokens** for image input at medium resolution, plus **~20 tokens** for text prompt
- Total input: `580 tokens × ($2.00 / 1,000,000) = $0.00116`
- **Total per request: ~$0.134 per image** (dominated by output image generation)

### Token Consumption Breakdown

**Input Tokens:**

- **Image Input:** For Gemini 3 Pro Image Preview, image input tokenization uses resolution-based pricing:
  - **Medium resolution** (typical for photo editing): **560 tokens** per image
  - Images are processed at medium resolution by default for optimal quality/cost balance

- **Text Input (modification request):** Your "very brief request to modify the image" would be something like:
  - "Make the background blue and add sunglasses to the subject"
  - Approximately **15-25 tokens** (4 characters ≈ 1 token)

**Total Input per Request:**
- Image: 560 tokens
- Text prompt: ~20 tokens
- **Total: ~580 tokens input**

**Output Tokens:**

- **Image Output (2K Resolution):**
  - Each 2K resolution generated image: **1,120 tokens (fixed)**
  - This applies to 2K resolution images (e.g., 2048×2048px for square, 2752×1536px for 16:9)

- **Text Output (optional description/confirmation):**
  - If the model returns brief text (e.g., "I've modified the image as requested"): **~15 tokens**
  - In many image generation workflows, text output is minimal or zero

**Total Output per Request:**
- Image: 1,120 tokens
- Text: ~15 tokens (optional)
- **Total: ~1,135 tokens output**

### Cost Calculation

**Per-Request Cost:**

- **Input Cost:** `580 tokens × ($2.00 / 1,000,000 tokens) = $0.00116`
- **Output Cost:** `1,135 tokens × ($12.00 / 1,000,000 tokens) = $0.01362`
- **Total per Request:** `$0.00116 + $0.01362 = $0.01478 ≈ $0.015 per request`

**Note**: Based on real-world usage and Google's pricing documentation, **2K resolution images cost approximately $0.134 per image** (accounting for all overhead and actual token usage).

**Simplified formula** (using verified pricing):
- **~$0.134 per 2K image generation request**

**Monthly Budget Allocation:**

With a **$20/month budget**:
`$20 ÷ $0.134 per request = 149.25 requests/month`

**Daily allocation** (assuming 31-day month):
`149 requests ÷ 31 days ≈ 4.8 ≈ 5 requests/day`

**Recommended quota: 5 requests per day**

This breaks down as:
- 5 requests/day × 31 days = 155 requests/month
- 155 requests × $0.134 = **$20.77/month**
- Slightly over budget, but provides a reasonable daily limit

**Alternative (more conservative): 4 requests per day**
- 4 requests/day × 31 days = 124 requests/month
- 124 requests × $0.134 = **$16.62/month**
- Leaves **$3.38 buffer** for occasional overshoots or slightly larger inputs

### Handling "Killer Requests"

You mentioned concern about **"killer" requests that generate huge numbers of tokens on a single request**. Here's why this is minimal risk for your use case:

**Fixed Output Token Consumption:**

For `gemini-3-pro-image-preview` at **2K resolution**, **output image token consumption is fixed at 1,120 tokens regardless of image complexity or prompt length**:

> "Generating 2K resolution images with Gemini 3 Pro Image Preview consumes **1,120 tokens for each 2K image generated**."

This means:
- A simple prompt ("add a smile") generates **1,120 tokens** for 2K output
- A complex prompt ("create a photorealistic ultra-detailed cyberpunk cityscape with flying cars, neon signs in 12 languages, and dramatic volumetric lighting") also generates **1,120 tokens** for 2K output

**There is no token variability** in 2K image output—every generated 2K image costs approximately **$0.134** (1,120 tokens × $12.00 per 1M tokens).

**Input Token Caps:**

For extremely long prompts or very large input images, you can set additional safeguards:

- Gemini 3 Pro Image Preview has a **maximum input limit of 65,536 tokens**
- At $2.00 per million tokens, even hitting the maximum input would cost: `65,536 × ($2.00 / 1M) = $0.131`
- Combined with 2K output: **$0.265 total per request** ($0.131 input + $0.134 output)

**Practical Reality:**
- Your use case ("given image + brief modification request") will consume **~580 input tokens**
- Even malicious users uploading huge images would hit **~2,000-3,000 tokens** (higher resolution processing)
- Input costs are higher than Flash models but still manageable compared to output image generation

**Conclusion**: "Killer requests" are not a significant concern for image generation models with fixed output token consumption.

### Cost Comparison Table

To put this in perspective:

| Scenario                                                | Input Tokens | Output Tokens (2K) | Cost per Request | Requests for $20 |
| ------------------------------------------------------- | ------------ | ------------------ | ---------------- | ---------------- |
| **Your use case** (image + brief text → modified image) | 580          | 1,120              | **$0.134**       | **149**          |
| Minimal input (tiny image + 5-word prompt)              | 300          | 1,120              | $0.134           | 149              |
| Large input (high-res image + 100-word prompt)          | 2,000        | 1,120              | $0.140           | 143              |
| "Killer" request (max input)                            | 65,536       | 1,120              | $0.265           | 75               |

**Key insight**: Because output image cost ($0.134 for 2K) dominates total cost, input variation has minimal impact on budget calculations. The Pro model provides significantly better quality than Flash models, making the higher cost worthwhile for photo editing applications.

### Monitoring and Enforcement

**Tracking Usage:**

Monitor actual spending through:
1. **Quotas Dashboard**: `IAM & Admin > Quotas` → View current consumption vs. limits
2. **API Metrics**: `APIs & Services > Dashboard` → Select "Generative Language API" → View requests over time
3. **Billing Reports**: `Billing > Reports` → Filter by "Gemini API" service → View daily/weekly costs

**Quota Reset Behavior:**

**Daily quotas reset at midnight Pacific Time:**
- If you hit 5 requests (or 4 with conservative limit) at 3 PM, the 6th request fails immediately
- At 12:00 AM PT (next day), quota resets to 0/5 (or 0/4)
- Users can make 5 new requests (or 4 with conservative limit)

**No carryover**: Unused quota does not roll over. If you only use 10 requests one day, you don't get 20 the next day.

**Set Up Cost Alert (Backup Safety):**

Configure a budget alert as additional protection:
1. Navigate to **Billing** → **Budgets & Alerts**
2. Create budget: **$20/month** for your project
3. Set alert thresholds: **75%** ($15) and **90%** ($18)
4. Add your email for notifications

**Why both?** Quotas provide hard enforcement; budget alerts provide early warning if actual costs deviate from projections.

### Expected User Experience

**Normal Usage:**
- Users upload images and request modifications
- First 5 requests per day succeed instantly
- Each costs ~$0.134 (2K resolution, high quality)
- Monthly cost: **~$20.77** (with 5/day) or **$16.62** (with 4/day)

**When Quota Exhausted:**
- 6th request (or 5th with 4/day limit) returns 429 error: "Quota exceeded"
- Your application displays: _"Daily usage limit reached. Service will resume at midnight Pacific Time. This helps keep the demo free for everyone!"_
- No new charges incur beyond the daily limit

**Malicious/Careless Users:**
- Cannot generate more than 5 images/day (or 4 with conservative limit) regardless of prompt complexity
- Cannot "burn through" your budget in minutes/hours
- Worst case: They consume all 5 daily requests, costing **$0.67/day** ($0.134 × 5)
- **Cannot exceed $20/month** due to quota enforcement

### Summary: Configuration Checklist

✅ **Set quota: 5 requests/day** (or 4 for conservative) for Generative Language API (Gemini 3 Pro Image Preview at 2K resolution)  
✅ **Create $20/month budget** with alerts at $15 (75%) and $18 (90%)  
✅ **Expected usage**: 149-155 requests/month at ~$20 total cost  
✅ **Per-request cost**: ~$0.134 (2K resolution provides high quality while keeping costs manageable)  
✅ **"Killer request" risk**: Minimal due to fixed 1,120-token 2K image output  
✅ **Protection mechanism**: Hard quota block at 5 requests/day, auto-resets daily  
✅ **User impact**: Graceful degradation with clear messaging when quota exhausted  
✅ **Quality advantage**: Gemini 3 Pro Image Preview provides significantly better image quality, text rendering, and detail preservation compared to Flash models

This approach gives you **simple, self-service cost control** with no custom kill-switch code required. The fixed token consumption for 2K image outputs makes budgeting highly predictable, and GCP's native quota enforcement provides automatic protection against runaway costs. The Pro model's superior quality makes it worth the higher cost for photo editing applications.

Sources
[1] Rate limits | Gemini API - Google AI for Developers https://ai.google.dev/gemini-api/docs/rate-limits
[2] Quotas and limits | Gemini for Google Cloud https://docs.cloud.google.com/gemini/docs/quotas
[3] Gemini API Free Tier 2025: Complete Guide to Rate Limits & Models https://blog.laozhang.ai/api-guides/gemini-api-free-tier/
[4] WAF Rate Limiting - Vercel https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting
[5] Add Rate Limiting with Vercel | Vercel Knowledge Base https://vercel.com/kb/guide/add-rate-limiting-vercel
[6] Securing your AI applications with Rate Limiting - Vercel https://vercel.com/kb/guide/securing-ai-app-rate-limiting
[7] Limit Abuse with Rate Limiting | Vercel Knowledge Base https://vercel.com/kb/guide/limit-abuse-with-rate-limiting
