# TrueFoundry AI Gateway Setup Guide

This guide explains how to configure the Photo Fun app to use TrueFoundry's AI Gateway instead of calling Google Gemini directly.

## Why Use TrueFoundry?

- **Centralized Control**: Manage API keys and access in one place
- **Unified API**: Switch between providers without code changes
- **Access Control & Observability**: Track usage, set quotas, manage permissions
- **Security**: Don't expose Gemini API keys in your frontend

## Step 1: Get Your TrueFoundry Base URL

The base URL format depends on your TrueFoundry deployment:

- **SaaS (Cloud)**: `https://api.truefoundry.com`
- **Self-hosted**: `https://{your-control-plane-url}`
- **Workspace-specific**: `https://{workspace}.api.truefoundry.com`

For workspace `sak-consulting`, it's likely:
```
https://api.truefoundry.com
```
or
```
https://sak-consulting.api.truefoundry.com
```

You can find your exact base URL in the TrueFoundry dashboard under **Settings → API Configuration**.

## Step 2: Generate Your API Key

### Option A: Using the "Access" Menu (Most Common)

1. Log into [TrueFoundry Dashboard](https://www.truefoundry.com/login)
   - **Note**: After logging in, you may be redirected to a workspace-specific URL (e.g., `https://{workspace}.truefoundry.com` or `https://{workspace}.truefoundry.cloud`)
2. Look at the **left sidebar** menu - you should see items like:
   - AI Gateway
   - Platform
   - **Access** ← Click here
   - Settings
3. Click on **"Access"** - This opens a page with:
   - **Personal Access Tokens (PATs)** section - For development/testing
   - **Virtual Account Tokens (VATs)** section - For production (requires admin)
4. Click **"New Personal Access Token"** or **"Create Personal Access Token"** button
5. Enter a name for your token (e.g., "Photo Fun App" or "Photo Fun Development")
6. Click **"Create"** or **"Generate"**
7. **IMPORTANT**: Copy the token immediately - you'll only see it once!

**What the button might be labeled:**
- "New Personal Access Token"
- "Create Personal Access Token"
- "Generate API Key"
- "Create Token"
- "Add Token"
- "+ New Token"

### Option B: Using Settings Menu

1. Log into [TrueFoundry Dashboard](https://www.truefoundry.com/login)
2. Click on your **profile icon** (usually in the top-right corner)
3. Select **"Settings"** or **"Account Settings"** from the dropdown
4. Look for tabs or sections like:
   - API Keys
   - Personal Access Tokens
   - Authentication
   - Credentials
5. Click **"Create New Token"** or **"Generate API Key"**
6. Copy the token immediately

### Option C: AI Gateway Section

Sometimes the API key creation is accessible from:
1. **AI Gateway** → **Settings** → **API Keys**
2. Or **AI Gateway** → **Access Control** → **Tokens**

### Option D: Direct URL (if available)

Try navigating directly to:
- `https://www.truefoundry.com/access` or
- `https://www.truefoundry.com/settings/api-keys`

### Alternative: Virtual Account Token (for production)

If you have admin privileges and want better security for production:
1. Go to **Access** → **Virtual Account Tokens**
2. Create a new virtual account
3. Generate a token for that account
4. This provides more granular permissions and is better for production use

### Still Can't Find It?

**Quick Checklist:**
- [ ] Logged into TrueFoundry dashboard
- [ ] Checked left sidebar for "Access" menu
- [ ] Checked profile menu → Settings
- [ ] Checked AI Gateway → Settings
- [ ] Looked for "Personal Access Token" or "API Key" options
- [ ] Tried searching the dashboard for "token" or "API key"

**Additional Tips:**
- The menu location may vary by TrueFoundry version
- Look for terms like: "Access", "API Keys", "Tokens", "Authentication", "Credentials"
- Check if there's a search bar in the dashboard - search for "API key" or "token"
- Check your permissions - you may need admin access
- Try switching to a different workspace if available
- Contact TrueFoundry support: support@truefoundry.com or use the chat/support option in the dashboard

## Step 3: Verify Your Model Identifier

Your model identifier format is: `{workspace}:{provider}:{model-name}`

Based on your endpoint `sak-consulting:google-gemini:google-gemini`:
- **Workspace**: `sak-consulting`
- **Provider**: `google-gemini`
- **Model**: `google-gemini`

You can verify this in the TrueFoundry dashboard:
1. Go to **AI Gateway → Models**
2. Find your Gemini model
3. The model identifier should match the format above

## Step 3.5: Configure Project Tracking for Cost Control (Optional)

You can tag requests for cost control and observability using custom metadata. **No formal project (ML resource) needs to be created** - you can use a simple string identifier.

### Option A: Use Custom Metadata (Recommended - No Formal Project Needed)

This is the simplest approach and doesn't require creating a formal project in TrueFoundry:

1. **Choose a project identifier** - This can be any string you want (e.g., `"photo-fun-app"`, `"photo-editing-service"`, or `"production"`)
2. **Set it in your `.env.local`** as `TRUEFOUNDRY_METADATA_PROJECT_ID`
3. The app will automatically add the `X-TFY-METADATA` header with `project_id` for:
   - **Cost control**: Set budget limits per `metadata.project_id` using `budget_applies_per: ['metadata.project_id']`
   - **Observability**: Track and filter requests by project in TrueFoundry analytics
   - **Conditional configurations**: Use metadata for routing or feature flags

**Example:**
```bash
TRUEFOUNDRY_METADATA_PROJECT_ID=photo-fun-app
```

This will send: `X-TFY-METADATA: {"project_id":"photo-fun-app"}` with every request.

### Option B: Use Formal Project ID (If You Have One)

If you already have a formal project (ML resource) in TrueFoundry and want to use its Project ID with the `x-tfy-project-id` header:

1. Log into [TrueFoundry Dashboard](https://www.truefoundry.com/login)
2. Go to **Platform → Projects** (or your workspace's project list)
3. Select the project you want to use for this app
4. Find the Project ID:
   - **Project Settings** or **Project Details** page - The Project ID should be displayed there (may have a "Copy" button)
   - **URL Inspection** - When viewing your project, check the browser URL. The Project ID often appears in the path: `.../projects/{project-id}/...` or as a parameter: `?projectId=...`
5. Copy the Project ID (usually a UUID format like `abc123-def456-...`)
6. Set it as `TRUEFOUNDRY_PROJECT_ID` in your `.env.local`

**Note**: Option A (custom metadata) is recommended as it doesn't require creating a formal project and works perfectly for cost control.

### Setting Up Budget Limits with Metadata

Once you've set `TRUEFOUNDRY_METADATA_PROJECT_ID`, you can configure budget limits in TrueFoundry:

1. Go to **AI Gateway → Budget Controls** (or **Budget Limiting**)
2. Create a budget limit
3. Set `budget_applies_per: ['metadata.project_id']` to apply budgets per your project identifier
4. This allows you to set spending limits per project without needing formal ML resources

See [TrueFoundry Budget Limiting Docs](https://truefoundry.com/docs/ai-gateway/budgetlimiting) for details.

### If You Skip Project Tracking

**You can skip this entirely!** The Project ID is completely optional. Your app will work perfectly without it. The `x-tfy-project-id` header is only added if you configure `TRUEFOUNDRY_PROJECT_ID` in your `.env.local` file.

**When you might want to use it:**
- If you want to track requests by project in TrueFoundry analytics
- If you're using multiple projects and want to organize requests
- For production deployments with project-based billing/tracking
- To group related API calls together in TrueFoundry's dashboard

**If you skip it:**
- Just don't set `TRUEFOUNDRY_PROJECT_ID` in your `.env.local` file
- Your app will work exactly the same, just without project-specific tagging
- You can always add it later if needed

## Step 4: Configure Environment Variables

Add these to your `.env.local` file:

```bash
# TrueFoundry Configuration (Required)
TRUEFOUNDRY_BASE_URL=https://api.truefoundry.com
TRUEFOUNDRY_API_KEY=your_truefoundry_api_key_here
TRUEFOUNDRY_MODEL=sak-consulting:google-gemini:google-gemini

# Optional: Project tracking for cost control and observability
# Option 1: Custom metadata (Recommended - no formal project needed)
# Just use any string identifier you want (e.g., "photo-fun-app", "production")
TRUEFOUNDRY_METADATA_PROJECT_ID=photo-fun-app

# Option 2: Formal project ID (if you have a formal ML resource project)
# TRUEFOUNDRY_PROJECT_ID=your_formal_project_id_here
```

**Important**: 
- If both TrueFoundry and direct Gemini API keys are set, TrueFoundry will be used first
- Remove `GEMINI_API_KEY` if you want to use only TrueFoundry
- `TRUEFOUNDRY_METADATA_PROJECT_ID` is **recommended** - it's simple and doesn't require creating a formal project
- `TRUEFOUNDRY_METADATA_PROJECT_ID` adds `X-TFY-METADATA` header with `project_id` for cost control via budget limiting
- `TRUEFOUNDRY_PROJECT_ID` adds `x-tfy-project-id` header (requires a formal project)
- Both are **completely optional** - your app works perfectly without them

## Step 5: Restart Your Dev Server

After updating `.env.local`:

```bash
npm run dev
```

## Troubleshooting

### "TrueFoundry configuration not found"
- Make sure `TRUEFOUNDRY_BASE_URL` and `TRUEFOUNDRY_API_KEY` are set in `.env.local`
- Restart your dev server after adding environment variables

### "401 Unauthorized" or "403 Forbidden"
- Verify your API key is correct
- Check that your API key has permissions to access Gemini models
- Ensure the API key hasn't expired

### "Model not found"
- Verify your `TRUEFOUNDRY_MODEL` matches exactly what's shown in the TrueFoundry dashboard
- Check that the model is enabled and available in your workspace

### Base URL Issues
- Try both `https://api.truefoundry.com` and `https://sak-consulting.api.truefoundry.com`
- Check the TrueFoundry dashboard for your exact control plane URL

## API Endpoints Used

The app uses TrueFoundry's OpenAI-compatible endpoints:

- **Chat Completions**: `/api/llm/api/inference/openai/v1/chat/completions`
- **Image Generation**: `/api/llm/api/inference/openai/v1/images/edits`

**Headers Sent:**
- `Authorization: Bearer {TRUEFOUNDRY_API_KEY}` - Required for authentication
- `Content-Type: application/json` - Standard content type
- `X-TFY-METADATA: {"project_id":"{TRUEFOUNDRY_METADATA_PROJECT_ID}"}` - Optional, added automatically if `TRUEFOUNDRY_METADATA_PROJECT_ID` is configured. Used for cost control (budget limiting per `metadata.project_id`) and observability. **Recommended** - no formal project needed.
- `x-tfy-project-id: {TRUEFOUNDRY_PROJECT_ID}` - Optional, added automatically if `TRUEFOUNDRY_PROJECT_ID` is configured. Requires a formal project (ML resource) in TrueFoundry.

## Fallback Behavior

If TrueFoundry is not configured, the app will automatically fall back to using the direct Google Gemini API (if `GEMINI_API_KEY` is set).

## Additional Resources

- [TrueFoundry AI Gateway Docs](https://truefoundry.com/docs/ai-gateway/quick-start)
- [TrueFoundry Authentication Guide](https://truefoundry.com/docs/ai-gateway/headers)
- [Custom Metadata for Observability](https://truefoundry.com/docs/ai-gateway/log-custom-metadata) - Using X-TFY-METADATA header
- [Budget Limiting](https://truefoundry.com/docs/ai-gateway/budgetlimiting) - Set budgets per `metadata.project_id`
- [TrueFoundry API Reference](https://truefoundry.com/docs/api-reference/chat/chat-completions)
