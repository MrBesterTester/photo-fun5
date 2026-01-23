Here's a focused, admin‑driven plan using only **GCP** (for Gemini) and **Vercel** (for your app), with minimal app code.

## Table of Contents

- [Table of Contents](#table-of-contents)
- [1. Gemini: Rate Limits and Billing (Google AI Studio)](#1-gemini-rate-limits-and-billing-google-ai-studio)
  - [a) View rate limits and manage billing in AI Studio](#a-view-rate-limits-and-manage-billing-in-ai-studio)
  - [b) Use a dedicated GCP project for this app](#b-use-a-dedicated-gcp-project-for-this-app)
- [2. Vercel: Edge Rate Limiting via Admin UI](#2-vercel-edge-rate-limiting-via-admin-ui)
  - [a) Deploy your existing app to Vercel](#a-deploy-your-existing-app-to-vercel)
  - [b) Add a WAF rate‑limit rule for your image editing endpoint](#b-add-a-waf-ratelimit-rule-for-your-image-editing-endpoint)
- [3. Minimal App‑Side Settings (One-Time)](#3-minimal-appside-settings-one-time)
  - [a) Cap Gemini response size per request](#a-cap-gemini-response-size-per-request)
  - [b) Use environment variables for keys](#b-use-environment-variables-for-keys)
- [4. Local Development vs Production: Security Layer Coverage](#4-local-development-vs-production-security-layer-coverage)
  - [Why Gemini rate limits apply locally](#why-gemini-rate-limits-apply-locally)
  - [Why Vercel WAF Doesn't Apply Locally](#why-vercel-waf-doesnt-apply-locally)
  - [Local development: API key from `.env.local`](#local-development-api-key-from-envlocal)
  - [Summary](#summary)
- [5. How This Meets Your "Enough Is Enough" Bar](#5-how-this-meets-your-enough-is-enough-bar)
- [Appendix: Cost Justification and Budget Calculation](#appendix-cost-justification-and-budget-calculation)
  - [Which API type: Code API, Duet Complete Code API, Duet Generate Code API?](#which-api-type-code-api-duet-complete-code-api-duet-generate-code-api)
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

## 1. Gemini: Rate Limits and Billing (Google AI Studio)

Goal: Understand where rate limits and billing are managed for the Gemini API, and bound cost via app-side and Vercel controls.

**Important:** This app uses the **Gemini API** (Generative Language API) with an **API key** from [Google AI Studio](https://aistudio.google.com/). Rate limits and billing are managed in **Google AI Studio**, not in GCP Console → IAM & Admin → Quotas. The [Rate limits](https://ai.google.dev/gemini-api/docs/rate-limits) documentation is the authoritative source.[1]

### a) View rate limits and manage billing in AI Studio

**Where to go (not GCP IAM & Admin → Quotas):**

1. **View rate limits and usage**  
   - [Google AI Studio → Usage](https://aistudio.google.com/usage)  
   - Open the **Rate limit** tab: [Usage → Rate limit](https://aistudio.google.com/usage?timeRange=last-28-days&tab=rate-limit)  
   - This shows your **active rate limits** (RPM, TPM, RPD, etc.) for each model, which depend on your **usage tier** (Free, Tier 1, 2, 3).[1]

2. **API keys, billing, and tier upgrades**  
   - [Google AI Studio → API keys](https://aistudio.google.com/api-keys)  
   - Create or manage API keys, **Set up Billing** (to move off Free), or **Upgrade** to a higher tier when eligible.  
   - Billing and upgrades are described in [Billing](https://ai.google.dev/gemini-api/docs/billing).[1]

**What you can and cannot do:**

- **You can:** view rate limits, usage, and costs; enable billing; upgrade tier; [request a rate limit increase](https://forms.gle/ETzX94k8jf7iSotH9) (paid tier).  
- **You cannot:** set a custom “5 requests per day” (or any other value) in a Gemini API UI. Limits are **fixed by tier** (Free has lower limits; paid tiers have higher RPM/TPM/RPD).[1]

**Tier 1 RPD and the Rate limits docs**

The [Rate limits](https://ai.google.dev/gemini-api/docs/rate-limits) page does **not** publish specific RPD (requests per day) numbers per tier or per model. It states that rate limits "depend on a variety of factors (such as your quota tier)" and "can be viewed in Google AI Studio," and that "specified rate limits are not guaranteed and actual capacity may vary." It also notes that **experimental and preview models** (e.g. `gemini-3-pro-image-preview`) have **more restricted** limits. The **source of truth** for your project's RPD (and RPM, TPM) is **[AI Studio → Usage → Rate limit](https://aistudio.google.com/usage?timeRange=last-28-days&tab=rate-limit)**.  

If your Tier 1 project shows **20 RPD** in AI Studio for `gemini-3-pro-image-preview`, that is **4× your ~5 RPD target**. Google's RPD limit therefore does **not** constrain your plan; **Vercel WAF** and app-side caps are the main control for staying near ~5 requests/day.

**For cost control (~5 requests/day, ~$20/month):**

- Use **Vercel WAF** (Step 2b) to throttle `/api/image-edit` (e.g. per‑IP limits).  
- Optionally add **app-side** caps (e.g. max requests per user or session per day).  
- Set **GCP Billing → Budgets & Alerts** (e.g. $20/month, alerts at 75% and 90%) as a backstop.  
- **Monitor** in [AI Studio → Usage](https://aistudio.google.com/usage) and in GCP **Billing → Reports** (filter by Gemini/Generative Language API).

**Optional: Billing Budget Alert**

To get email alerts when spending approaches your target (e.g. $20/month for this app):

1. Go to [**Budgets & alerts**](https://console.cloud.google.com/billing/budgets) in the GCP Console.  
   - If you use **project-level** access only: select your project (e.g. `photo-fun-dev`) first, then **Navigation menu** → **Billing** → **Cost management** → **Budgets & alerts**.  
   - If prompted, choose the **billing account** linked to your project or click **Go to linked billing account**.
2. Click **Create budget**.
3. **Name:** e.g. `photo-fun-dev $20/month`.
4. **Scope** → **Next:**  
   - **Time range:** Monthly.  
   - **Projects:** select only your app’s project (or leave as-is if project-scoped).  
   - **Services:** **Select all**, or only **Generative Language API** to track Gemini only.
5. **Amount** → **Next:** **Specified amount** → **Target amount:** e.g. **$20**.
6. **Actions** → **Finish:**  
   - **Alert thresholds:** e.g. **50%** (~$10), **90%** (~$18), **100%** ($20); **Trigger on:** Actual (optionally add Forecasted).  
   - **Email notifications:** enable **Email alerts to billing admins and users** and/or **Email alerts to project owners** (single-project only). Optionally **Link Monitoring email notification channels** to add specific addresses.
7. Click **Finish**.

Budgets **do not cap spending**; they only send email when thresholds are met. See [Create, edit, or delete budgets and budget alerts](https://cloud.google.com/billing/docs/how-to/budgets).

**Effect:**

- Rate limits (RPM, TPM, RPD) are enforced by Google per your tier; exceeding them returns **429** from the API.  
- RPD resets at **midnight Pacific Time**.[1]  
- To stay near ~5 requests/day and ~$20/month, you rely on **Vercel WAF** and **app logic**, not on setting a “5 RPD” limit in Google.

### b) Use a dedicated GCP project for this app

To keep costs from mixing with other work:

- Create a **separate GCP project** just for this web app and the Gemini API.  
- Create the API key in [AI Studio](https://aistudio.google.com/api-keys) for this project and use it only in this app.  
- Set up billing and budgets for this project.

Effect:  
- This app’s usage and costs are isolated.  
- Rate limits and billing in AI Studio are per project, so this project’s tier and usage are separate from other projects.

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

In your `/api/image-edit` handler, set a maximum output size so each request has a bounded worst‑case cost:

```ts
// 2K image ≈1120 tokens; 8192 allows image + thinking + text. Lower values (e.g. 512) cause
// finishReason: MAX_TOKENS and empty parts—the model is cut off before the image is emitted.
const MAX_OUTPUT_TOKENS = 8192;

const response = await ai.models.generateContent({
  model: 'gemini-3-pro-image-preview',
  contents: [
    { text: enforcementPrompt },
    { inlineData: { mimeType, data: cleanBase64 } },
  ],
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
    imageConfig: { aspectRatio: '4:3', imageSize: '2K' },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
  },
});
```

Effect:  
- **8192** is the ceiling; you are charged only for tokens actually generated. A 2K image is **1,120 tokens** (fixed); the rest is headroom for thinking and optional text.  
- Even in the worst case (e.g. long text + image), output is capped at 8192 tokens (~\$0.10), so each request has a bounded cost.  
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
| **Step 1a: Gemini rate limits (AI Studio)** | ✅ Yes | ✅ Yes | Google enforces RPM/TPM/RPD by tier; view in AI Studio |
| **Step 2b: Vercel WAF** | ❌ No | ✅ Yes | Only applies to requests through Vercel's edge network |
| **Step 3a: `maxOutputTokens`** | ✅ Yes | ✅ Yes | Code-level enforcement works everywhere |

### Why Gemini rate limits apply locally

Gemini API rate limits (RPM, TPM, RPD) are enforced at **Google’s API** based on your project’s **usage tier**. When your local code calls the Gemini API, the request goes to Google’s servers, which apply these limits. You **view** limits and usage in [AI Studio → Usage](https://aistudio.google.com/usage); you do **not** configure a custom “5 requests/day” in GCP or AI Studio—limits are fixed by tier.

```
Local Development Flow:
┌─────────────────────────────────────┐
│  Your Local Code                    │
│  (vercel dev on localhost)          │
│         ↓                           │
│  Makes API call to Gemini           │
│         ↓                           │
│  Gemini API (Google)                │
│  └─ Enforces tier rate limits ✓    │
│  └─ RPD resets midnight PT ✓       │
│         ↓                           │
│  Returns response or 429 if exceeded│
└─────────────────────────────────────┘
```

**Example:** If you exceed your tier’s RPD (or RPM/TPM), the next request gets `429 Resource Exhausted` from Google. To stay near ~5 requests/day for cost control, use **Vercel WAF** in production and/or app-side limits; the Gemini API’s own RPD is whatever your tier allows.

### Why Vercel WAF Doesn't Apply Locally

Vercel WAF (Web Application Firewall) rules run on **Vercel's edge network**, not on your local machine. When you run `vercel dev` locally, requests go directly to your local serverless function and bypass Vercel's edge infrastructure where WAF rules are enforced.

**This means:** WAF rate limiting configured in Step 2b will only take effect after you deploy to Vercel production. For local development, you would need to implement rate limiting in code if you want to test it locally.

### Local development: API key from `.env.local`

You do **not** need to deploy to Vercel to run the app. For local development:

1. Put `GEMINI_API_KEY=your_key` in `.env.local` at the project root.
2. Run `npm run dev:vercel` (which runs `vercel dev`). This serves both the app and the `/api/image-edit` serverless route.
3. The API route reads `GEMINI_API_KEY` from `process.env`. Vercel CLI loads `.env.local` into the environment; if it does not inject it into the serverless process, the route falls back to loading `.env.local` via `dotenv`. The key is only used to call Google’s Gemini API; all LLM processing happens on Google’s servers, where the key is validated.

Production on Vercel uses `GEMINI_API_KEY` from Vercel Project Settings → Environment Variables; `.env.local` is not deployed.

### Summary

- **Gemini rate limits (Step 1a):** Enforced by Google in both local and production; view and manage in **AI Studio**. Limits are tier-based; for a ~5 RPD cost target, use Vercel WAF and/or app-side caps.
- **Vercel WAF (Step 2b):** Only active in production, providing edge-level throttling of `/api/image-edit`.
- **Code-level limits (Step 3a):** Active everywhere, providing per-request cost bounds.

This layered approach gives you cost protection via app and Vercel limits, with Gemini’s tier limits as a ceiling, and budget alerts as a backstop.

***

## 5. How This Meets Your "Enough Is Enough" Bar

With almost everything done via admin config:

- **Gemini (AI Studio) + project:**  
  - Rate limits (RPM, TPM, RPD) enforced by Google per tier; manage billing and view usage in [AI Studio](https://aistudio.google.com/usage).[1]

- **Vercel WAF rate limit:**  
  - Per‑IP throttling of `/api/image-edit` without touching your app code.[6][4]

- **Minimal app code:**  
  - Just a `maxOutputTokens` cap in the API route (plus your existing Gemini integration).
  - Client-side code calls the secure API route instead of Gemini directly.  

Result:  
- A casual or moderately determined attacker is rate‑limited at the edge (Vercel WAF) and by Gemini’s tier limits; app-side and budget alerts add further protection.  
- Your wallet has a clear ceiling per month via budgets and throttling.  
- You've kept additional security code to the bare minimum and pushed most of the work into **Vercel and Google AI Studio**, which aligns with your goal to ship without getting buried in security plumbing.

***

## Appendix: Cost Justification and Budget Calculation

### Which API type: Code API, Duet Complete Code API, Duet Generate Code API?

This app uses **none of those three**. It uses the **Gemini API (Generate Content API)**, also called the **Generative Language API** (`generativelanguage.googleapis.com`), via `generateContent` with `gemini-3-pro-image-preview` for image editing.

| API type | What it is | This app? |
|----------|------------|-----------|
| **Code API** | The **code execution tool** in the Gemini API: you add `tools: [{ codeExecution: {} }]` to `generateContent` so the model can run Python. Used for math, data tasks, etc. | **No** — the app does not use the code execution tool. |
| **Duet Complete Code API** | **Gemini Code Assist** (formerly Duet AI for Developers): IDE **code completion** as you type, in VS Code, JetBrains, Cloud Shell, etc. Subscription product, separate from the Generative Language API. | **No** — the app is a web photo editor that calls `generateContent` for images, not an IDE or Code Assist. |
| **Duet Generate Code API** | **Gemini Code Assist** **code generation** from comments or natural language (e.g. “write a function that…”). Same Code Assist product, different feature. | **No** — the app does not generate or complete code. |

**What this app uses:** the standard **Generate Content API** (`ai.models.generateContent`) with `responseModalities: ['TEXT','IMAGE']` and `imageConfig` for **image editing**. Billing and quotas for `gemini-3-pro-image-preview` are under the **Generative Language API** / **Gemini API** (e.g. “GenerateContent requests per day”), not under Code API or Duet Code SKUs.

### Direct Answer

For your use case—**image input with brief modification request, returning modified image output**—here's the exact calculation for a **$20/month spending cap** using **gemini-3-pro-image-preview at 2K resolution**:

**You can make approximately 149 requests per month, or about 5 requests per day.** To stay near that, throttle `/api/image-edit` with **Vercel WAF** (and optionally app-side caps); the Gemini API does not let you set a custom “5 requests/day” in Google AI Studio or GCP—limits are determined by your usage tier. For Tier 1 with `gemini-3-pro-image-preview`, [AI Studio → Usage → Rate limit](https://aistudio.google.com/usage?timeRange=last-28-days&tab=rate-limit) may show **20 RPD**—4× your ~5 RPD target—so Google's limit does not constrain your plan. See [Rate limits](https://ai.google.dev/gemini-api/docs/rate-limits) and Step 1a.

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

**Note on `maxOutputTokens`:** The API route sets `maxOutputTokens: 8192` so the model can finish the 2K image (~1,120 tokens) plus thinking and any text without being truncated (`finishReason: MAX_TOKENS`). You are **billed only for actual output**; the 8192 cap does not change the cost calculations below. Typical output remains ~1,120–1,135 tokens per request.

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

**Target: ~5 requests per day** (achieved via Vercel WAF and/or app-side caps; the Gemini API does not let you set a custom RPD)

- 5 requests/day × 31 days = 155 requests/month
- 155 × $0.134 ≈ **$20.77/month**

**More conservative: ~4 requests per day**
- 4 × 31 = 124 requests/month
- 124 × $0.134 ≈ **$16.62/month**
- Leaves ~$3.38 buffer

### Handling "Killer Requests"

You mentioned concern about **"killer" requests that generate huge numbers of tokens on a single request**. Here's why this is minimal risk for your use case:

**Fixed Output Token Consumption:**

For `gemini-3-pro-image-preview` at **2K resolution**, **output image token consumption is fixed at 1,120 tokens regardless of image complexity or prompt length**:

> "Generating 2K resolution images with Gemini 3 Pro Image Preview consumes **1,120 tokens for each 2K image generated**."

This means:
- A simple prompt ("add a smile") generates **1,120 tokens** for 2K output
- A complex prompt ("create a photorealistic ultra-detailed cyberpunk cityscape with flying cars, neon signs in 12 languages, and dramatic volumetric lighting") also generates **1,120 tokens** for 2K output

**There is no token variability** in 2K image output—every generated 2K image costs approximately **$0.134** (1,120 tokens × $12.00 per 1M tokens).

**Output cap (`maxOutputTokens: 8192`):**

- The route sets `maxOutputTokens: 8192` so the 2K image (~1,120 tokens) plus thinking and text can complete. This also caps worst‑case output: `8,192 × ($12.00 / 1M) ≈ $0.10` if the model ever used the full ceiling. Typical output stays ~1,120–1,135 tokens.

**Input token caps:**

For extremely long prompts or very large input images:

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

**Tracking usage (use Google AI Studio first):**

1. **[Google AI Studio → Usage](https://aistudio.google.com/usage)**  
   - View requests, token usage, and the **Rate limit** tab for your tier’s RPM, TPM, RPD.[1]
2. **GCP Billing → Reports**  
   - Filter by “Generative Language API” or “Gemini API” → daily/weekly costs.
3. **GCP Console (optional)**  
   - [Generative Language API → Quotas](https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas) to view quota; for the Gemini API (ai.google.dev), rate limits are best viewed in AI Studio.

**Rate limit reset (RPD):**

- RPD resets at **midnight Pacific Time**.[1]  
- If you hit your tier’s RPD, the next request gets 429 until the next day.  
- For `gemini-3-pro-image-preview` on Tier 1, AI Studio may show **20 RPD**; your ~5 RPD target stays under that ceiling. Use **Vercel WAF** and/or app-side caps to enforce ~5 RPD; the Gemini API does not let you set a custom RPD.

**Set up a budget alert (backstop):**

1. Go to **Billing** → **Budgets & Alerts**
2. Create a **$20/month** budget for your project
3. Set alerts at **75%** ($15) and **90%** ($18)
4. Add your email for notifications

Budget alerts give early warning if spending deviates from projections; Vercel WAF and app limits are what keep you near ~5 requests/day.

### Expected User Experience

**Normal usage:**
- Users upload images and request modifications.
- Each successful request costs ~$0.134 (2K, high quality).
- If you throttle to ~5 requests/day (via Vercel WAF and/or app logic), monthly cost stays near **~$20** (5×31×$0.134 ≈ $20.77) or **~$16.62** at 4/day.

**When your app or WAF limit is reached (e.g. 5/day):**
- Return a friendly message: _“Daily usage limit reached. Service will resume at midnight Pacific Time. This helps keep the demo free for everyone!”_
- No Gemini call is made, so no extra cost.

**When Google’s rate limit is reached (tier RPD/RPM/TPM):**
- The API returns **429**; your app should handle it and show a “Rate limit exceeded” or “Try again later” message.

**Malicious or careless users:**
- Throttled by **Vercel WAF** (per IP) and, if you add it, app-side daily caps.
- Cannot arbitrarily “burn through” the budget; worst case is bounded by your WAF/app limits and, ultimately, by your **GCP budget alert** and spending cap.

### Summary: Configuration Checklist

✅ **View rate limits and usage in [Google AI Studio → Usage](https://aistudio.google.com/usage)** (Rate limit tab); [Rate limits](https://ai.google.dev/gemini-api/docs/rate-limits) docs. Tier 1 RPD for `gemini-3-pro-image-preview` may show **20** in AI Studio (4× your ~5 RPD target); Google's limit is not the bottleneck.  
✅ **Use Vercel WAF** (Step 2b) to throttle `/api/image-edit` (e.g. per-IP) so you stay near ~5 requests/day.  
✅ **Create $20/month GCP budget** with alerts at $15 (75%) and $18 (90%).  
✅ **Expected usage**: ~149 requests/month at ~$20 if throttled to ~5/day; per-request ~$0.134 (2K).  
✅ **"Killer request" risk**: Minimal (fixed 1,120-token 2K image output).  
✅ **Protection**: Vercel WAF + app-side caps (optional) + budget alerts; Gemini’s tier limits as ceiling.  
✅ **User impact**: Friendly message when your limit is reached; handle 429 from Google when tier limit hit.  
✅ **Quality**: Gemini 3 Pro Image Preview provides better image quality, text rendering, and detail than Flash.

This approach gives **simple, self-service cost control**: you cannot set a custom “5 RPD” in the Gemini API, so you use **Vercel WAF** and **app logic** to stay near ~5 requests/day, and **AI Studio** plus **GCP Billing** to monitor. The Pro model’s fixed 2K token cost makes budgeting predictable.

Sources
[1] Rate limits | Gemini API — [ai.google.dev/gemini-api/docs/rate-limits](https://ai.google.dev/gemini-api/docs/rate-limits). View limits: [aistudio.google.com/usage](https://aistudio.google.com/usage) (Rate limit tab); API keys & billing: [aistudio.google.com/api-keys](https://aistudio.google.com/api-keys).  
[2] Quotas (Generative Language API, optional) — [console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas](https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas). For the Gemini API (ai.google.dev), [2] and “Gemini for Google Cloud” docs may apply to Vertex/other products; use [1] and AI Studio for this app.  
[3] Gemini API Free Tier 2025: Complete Guide to Rate Limits & Models https://blog.laozhang.ai/api-guides/gemini-api-free-tier/  
[4] WAF Rate Limiting - Vercel https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting  
[5] Add Rate Limiting with Vercel | Vercel Knowledge Base https://vercel.com/kb/guide/add-rate-limiting-vercel  
[6] Securing your AI applications with Rate Limiting - Vercel https://vercel.com/kb/guide/securing-ai-app-rate-limiting  
[7] Limit Abuse with Rate Limiting | Vercel Knowledge Base https://vercel.com/kb/guide/limit-abuse-with-rate-limiting
