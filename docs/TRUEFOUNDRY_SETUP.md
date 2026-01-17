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

1. Log into [TrueFoundry Dashboard](https://app.truefoundry.com)
2. Go to **Settings → API Keys** (or **Personal Access Tokens**)
3. Click **Create New Token** or **Generate API Key**
4. Copy the generated token (you'll only see it once!)

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

## Step 4: Configure Environment Variables

Add these to your `.env.local` file:

```bash
# TrueFoundry Configuration
TRUEFOUNDRY_BASE_URL=https://api.truefoundry.com
TRUEFOUNDRY_API_KEY=your_truefoundry_api_key_here
TRUEFOUNDRY_MODEL=sak-consulting:google-gemini:google-gemini
```

**Important**: 
- If both TrueFoundry and direct Gemini API keys are set, TrueFoundry will be used first
- Remove `GEMINI_API_KEY` if you want to use only TrueFoundry

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

## Fallback Behavior

If TrueFoundry is not configured, the app will automatically fall back to using the direct Google Gemini API (if `GEMINI_API_KEY` is set).

## Additional Resources

- [TrueFoundry AI Gateway Docs](https://truefoundry.com/docs/ai-gateway/quick-start)
- [TrueFoundry Authentication Guide](https://truefoundry.com/docs/ai-gateway/headers)
- [TrueFoundry API Reference](https://truefoundry.com/docs/api-reference/chat/chat-completions)
