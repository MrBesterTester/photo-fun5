# CI/CD Setup Guide for Photo Fun

<!-- TOC -->

- [Purpose](#purpose)
- [Intention](#intention)
- [Overview](#overview)
- [GitHub Actions CI Setup](#github-actions-ci-setup)
  - [Step 0: Get GitHub Personal Access Token (Optional)](#step-0-get-github-personal-access-token-optional)
  - [Step 1: Create Workflow File](#step-1-create-workflow-file)
  - [Step 2: Configure GitHub Secrets (if needed)](#step-2-configure-github-secrets-if-needed)
  - [Step 3: Create GitHub Repository (if needed)](#step-3-create-github-repository-if-needed)
  - [Step 3.5: Set Up SSH Authentication (Optional but Recommended)](#step-35-set-up-ssh-authentication-optional-but-recommended)
  - [Step 4: Push and Test](#step-4-push-and-test)
- [Deployment to Vercel](#deployment-to-vercel)
  - [Overview](#overview)
  - [Prerequisites](#prerequisites)
  - [Initial Setup](#initial-setup)
  - [Deployment Process](#deployment-process)
- [Workflow Configuration](#workflow-configuration)
  - [What Gets Tested](#what-gets-tested)
  - [When CI Runs](#when-ci-runs)
  - [Skipping CI (Optional)](#skipping-ci-optional)
  - [Controlling CI](#controlling-ci)
- [Troubleshooting](#troubleshooting)
  - [CI Fails But Local Build Works](#ci-fails-but-local-build-works)
  - [Vercel Deployment Fails](#vercel-deployment-fails)
  - [Secrets and Environment Variables](#secrets-and-environment-variables)
- [Next Steps](#next-steps)
- [Custom Domain Configuration (Vercel)](#custom-domain-configuration-vercel)
  - [Overview](#overview)
  - [Setup Procedure](#setup-procedure)
  - [Troubleshooting](#troubleshooting-1)

<!-- /TOC -->

## Purpose

This guide provides step-by-step instructions for setting up:

1. **GitHub Actions CI** — Automated build and type checking on every push
2. **Vercel Deployment** — Deploy the app (Vite frontend + `/api/image-edit` serverless route) to Vercel

**Key principle:** CI runs automatically on every push. **Vercel deploys automatically** when your GitHub repo is connected—each push to the production branch (usually `main`) triggers a new deployment. No separate “deploy” step or GitHub Actions job is required for Vercel.

---

## Intention

We use the **Vercel CLI locally** (e.g. `npm run dev:vercel`) to put final touches on the web app and to run the frontend and `/api/image-edit` together before pushing. We **do not**, however, publish directly from the local repo with Cursor or from the Vercel CLI. Instead, we **push the repo to GitHub**, where:

1. **Showcase** — The source code is visible for exhibition and portfolio purposes.
2. **Deployment** — Vercel is connected to the GitHub repo and deploys automatically on push to `main`. All production releases go through GitHub.
3. **Security** — We rely on **GitHub's security checks** (e.g. dependency scanning, Dependabot alerts, and CodeQL when enabled) as part of the workflow. Pushing to GitHub ensures the code is checked there before it reaches production.

The intended flow: develop and test locally with the Vercel CLI → commit → **push to GitHub** → CI runs and Vercel deploys from the GitHub source. The local machine is for authoring and validation, not for publishing.

---

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│  LOCAL DEVELOPMENT                                           │
│                                                               │
│  1. Write code                                                │
│  2. Test locally: npm run build (or npm run dev:vercel)    │
│  3. Commit: git commit -m "feature"                         │
│  4. Push: git push origin main                               │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ git push
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  GITHUB ACTIONS CI                                          │
│                                                               │
│  5. Automatically runs:                                     │
│     - Type check (tsc --noEmit)                             │
│     - Build (vite build)                                     │
│     - Security scan (npm audit + CodeQL)                    │
│  6. Reports: ✅ PASS or ❌ FAIL                              │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ (push to main; repo connected to Vercel)
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  VERCEL (automatic, no GitHub Actions deploy job)           │
│                                                               │
│  7. Vercel sees push to main, runs its own build, deploys.   │
│  8. App is live at: https://your-project.vercel.app          │
│     - Frontend: Vite app                                     │
│     - API: /api/image-edit (serverless, calls Gemini)       │
└─────────────────────────────────────────────────────────────┘

Note: For local dev with the API route, use npm run dev:vercel (vercel dev).
Set GEMINI_API_KEY in .env.local; see docs/start_vercel-deployment-steps.md.
```

---

## GitHub Actions CI Setup

### Step 0: Get GitHub Personal Access Token (Optional)

If you plan to use the GitHub MCP server in Cursor, you'll need a GitHub Personal Access Token:

1. **Go to GitHub Settings:**
   - Log in to your GitHub account
   - Click your profile picture (top right) → **Settings**
   - In the left sidebar, click **Developer settings**

2. **Create a New Token:**
   - Under **Personal access tokens**, click **Tokens (classic)**
   - Click **Generate new token (classic)**

3. **Configure the Token:**
   - **Note:** Give it a descriptive name (e.g., "Cursor MCP")
   - **Expiration:** Choose an expiration period
   - **Scopes:** Select `repo` (full control of private repositories)
   - Click **Generate token**

4. **Copy the Token:**
   - **Important:** Copy the token immediately—you won't be able to see it again!
   - Add it to your `~/.cursor/mcp.json` in the `env` section of the GitHub MCP server:
     ```json
     {
       "mcpServers": {
         "github": {
           "command": "npx",
           "args": ["-y", "github-mcp@latest"],
           "env": {
             "GITHUB_PERSONAL_ACCESS_TOKEN": "paste_your_token_here"
           }
         }
       }
     }
     ```
   - Reload Cursor to apply changes:
     - Press `Cmd+Shift+P` → Type "Reload Window" → Select it
     - Or fully restart Cursor if needed

**Direct link:** https://github.com/settings/tokens

**Note:** This step is only needed if you want to use GitHub MCP features in Cursor. It's not required for GitHub Actions CI or Vercel to work.

### Step 1: Create Workflow File

Create the GitHub Actions workflow file:

**File:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run type check
        run: npx tsc --noEmit

      - name: Build application
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 7

  security-scan:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      contents: read

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run npm audit
        run: npm audit --audit-level=moderate
        continue-on-error: true

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v4
        with:
          languages: javascript-typescript

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v4
```

**What this does:**
- Runs on every push to `main`/`master` and on pull requests
- **Build and Test Job:**
  - Installs Node.js 20 with npm caching
  - Runs type checking (`tsc --noEmit`) and build (`vite build`)
  - Uploads `dist/` for 7 days (optional; Vercel builds its own when deploying)
- **Security Scan Job:**
  - Runs npm audit to check for dependency vulnerabilities
  - Performs CodeQL analysis to detect security vulnerabilities in the code
  - Results are uploaded to GitHub Security tab for review

**Note:** The API key `GEMINI_API_KEY` is not needed in CI. It is only used at **runtime** in the Vercel serverless function (`api/image-edit.ts`) and is set in Vercel Project Settings → Environment Variables. The Vite build does not embed the key in client bundles.

### Step 2: Configure GitHub Secrets (if needed)

For CI, **no secrets are required**. The app uses `GEMINI_API_KEY` only in the Vercel serverless route; that key is configured in **Vercel** Project Settings → Environment Variables, not in GitHub Secrets.

If you add features that need secrets in **CI** (e.g. an E2E test that calls a staging API):

1. Go to: `https://github.com/MrBesterTester/photo-fun5/settings/secrets/actions`
2. Click **New repository secret**
3. Add secrets as needed
4. Reference in workflow: `${{ secrets.SECRET_NAME }}`

### Step 3: Create GitHub Repository (if needed)

If you haven't created a GitHub repository for this project yet:

1. **Go to GitHub.com:**
   - Log in to your GitHub account
   - Click the "+" icon (top right) → **New repository**

2. **Create the repository:**
   - **Repository name:** `photo-fun5` (or your choice)
   - **Description:** (optional) e.g. "AI-powered photo editing with Gemini"
   - **Visibility:** Choose Public or Private
   - **Do not** initialize with README, .gitignore, or license if you already have them
   - Click **Create repository**

3. **Connect your local repo to GitHub:**
   ```bash
   git remote add origin git@github.com:MrBesterTester/photo-fun5.git
   ```

   Use your own GitHub username or organization in the URL above if different from MrBesterTester.

### Step 3.5: Set Up SSH Authentication (Optional but Recommended)

**If you already have an SSH key:** Run this to verify it works with GitHub:

```bash
ssh -T git@github.com
```

If you see `Hi <username>! You've successfully authenticated...`, you're set—use the SSH remote from Step 3 and skip the steps below.

**If the test fails or you don't have a key yet:**

1. **Generate SSH Key** (e.g. in 1Password: New Item → SSH Key → Generate; or `ssh-keygen -t ed25519`).
2. **Add the public key to GitHub:** https://github.com/settings/keys → **New SSH key**.
3. **Use 1Password as SSH Agent** (if applicable): 1Password → Preferences → Developer → “Use 1Password as SSH Agent”.
4. **Test again:** `ssh -T git@github.com`

### Step 4: Push and Test

1. **Commit and push:**
   ```bash
   git add ./.github/
   git commit -m "Add GitHub Actions CI workflow"
   git push origin main
   ```
   (The folder is `.github` with a leading dot—use `./.github/` or `.github/`, not `github`.)

2. **Watch it run:**
   - Go to: `https://github.com/MrBesterTester/photo-fun5/actions`
   - A workflow run should start within seconds of pushing
   - Click the run to see logs; it should finish in about 1–2 minutes

3. **Verify:**
   - Green ✅ on the commit
   - All steps pass

---

## Deployment to Vercel

### Overview

**Vercel deploys automatically** when you push to the branch connected to your Vercel project (usually `main`). You do **not** need a GitHub Actions job to deploy. After you connect the repo in the Vercel dashboard and set `GEMINI_API_KEY`, each push to `main` triggers a Vercel build and deployment.

**See also:**
- [docs/start_vercel-deployment-steps.md](./start_vercel-deployment-steps.md) — Local dev with `vercel dev` and first-time setup
- [docs/cost-security_gcp-vercel.md](./cost-security_gcp-vercel.md) — Env vars, WAF rate limiting for `/api/image-edit`, GCP/Gemini billing

### Prerequisites

1. **Vercel account** — [vercel.com](https://vercel.com)
2. **GitHub repository** — This project pushed to GitHub
3. **Gemini API key** — From [Google AI Studio](https://aistudio.google.com/api-keys) for the `/api/image-edit` route

### Initial Setup

1. **Import the project in Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your **GitHub** repo (`photo-fun5` or your repo name)
   - Use the **Vite** preset (or leave default; Vercel usually detects `vite` from `package.json`)
   - **Root Directory:** leave default (project root)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `dist` (Vite default)
   - **Install Command:** `npm install` or `npm ci`

2. **Set environment variables:**
   - In the import flow, or after: **Project Settings → Environment Variables**
   - Add: **`GEMINI_API_KEY`** = your Gemini API key
   - **Important:** Do not expose the key to the client. It is only used in `api/image-edit.ts` (serverless). Avoid `VITE_*` or any client-exposed variable for the key. See [cost-security_gcp-vercel.md](./cost-security_gcp-vercel.md).

3. **Deploy:**
   - Click **Deploy**. Vercel builds and deploys. The first deployment may take a few minutes.

4. **Optional — WAF rate limiting (recommended for cost control):**
   - In Vercel: **Security → Firewall (WAF)** → **Configure** → **+ New Rule**
   - **Conditions:** `Request Path` `Equals` `/api/image-edit`
   - **Action:** `Rate Limit` — e.g. Fixed Window, 60 seconds, limit 20–30 per IP
   - See [cost-security_gcp-vercel.md](./cost-security_gcp-vercel.md) for details.

**Project layout Vercel uses:**
- **Frontend:** `vite build` → `dist/` (served as static)
- **API route:** `api/image-edit.ts` → serverless function at `/api/image-edit`  
  Vercel detects the `api/` directory automatically when using `vercel` CLI or the Vite + `api/` layout.

### Deployment Process

**How it works:**

1. **You push to `main`** → `git push origin main`
2. **GitHub Actions runs CI** (if you added `.github/workflows/ci.yml`) — type check and build
3. **Vercel** (independently) sees the push to the connected branch
4. **Vercel** runs `npm install` and `npm run build`, then deploys:
   - Static assets from `dist/`
   - Serverless function from `api/image-edit.ts` at `/api/image-edit`
5. **App is live** at `https://your-project.vercel.app`

**Timeline:**
- CI: ~1–2 minutes after push
- Vercel: typically 1–3 minutes after push (build + deploy)

**Preview deployments:** If you enable Vercel’s GitHub integration, push to a non-production branch (or open a PR) to get preview URLs. `GEMINI_API_KEY` from Production (or a dedicated Preview) is used for `/api/image-edit` in previews if you’ve set it for the Preview environment.

---

## Workflow Configuration

### What Gets Tested

**In CI:**
- ✅ TypeScript type checking (`tsc --noEmit`)
- ✅ Application build (`npm run build` / `vite build`)
- ✅ Security scanning (npm audit for dependency vulnerabilities)
- ✅ CodeQL analysis for code security vulnerabilities

**Not in CI:**
- ❌ Linting (add `npm run lint` when you add ESLint)
- ❌ E2E or browser tests
- ❌ Calling the real Gemini API (key not in CI)

**At runtime (Vercel):**
- The `/api/image-edit` serverless function calls the Gemini API using `GEMINI_API_KEY` from Vercel env. Rate limiting and cost control: see [cost-security_gcp-vercel.md](./cost-security_gcp-vercel.md).

### When CI Runs

**CI runs when:**
- ✅ Push to `main` or `master`
- ✅ Pull requests targeting `main` or `master`
- ✅ Manual run from the Actions tab (if you add `workflow_dispatch`)

**CI does not run when:**
- ❌ You only commit locally without pushing
- ❌ Push only to other branches (unless you add them to `branches`)

### Skipping CI (Optional)

**Don’t push yet:**
```bash
git commit -m "WIP: experimental"
# When ready: git push origin main
```

**Use a non‑CI branch:**
```bash
git checkout -b wip/experiment
git push origin wip/experiment
# CI runs only for main/master in the workflow above
```

### Controlling CI

**Temporarily disable:**
```bash
mv .github/workflows/ci.yml .github/workflows/ci.yml.disabled
git add .github/
git commit -m "Temporarily disable CI"
git push
```

**Remove:**
```bash
git rm .github/workflows/ci.yml
git commit -m "Remove CI"
git push
```

---

## Troubleshooting

### CI Fails But Local Build Works

**Common causes:**
1. **Node version** — Use `node-version: '20'` (or your local version) in `actions/setup-node`.
2. **Lockfile** — Ensure `package-lock.json` is committed; CI uses `npm ci`.
3. **Paths** — CI runs from repo root; keep paths relative.
4. **`tsc --noEmit`** — If it fails, run `npx tsc --noEmit` locally; fix type errors or `tsconfig.json`.

### Vercel Deployment Fails

**Build fails:**
- Check Vercel build logs for the failing command.
- Ensure `npm run build` works locally.
- If you use `npx vercel` or `vercel` CLI, run `vercel build` (or `npm run build`) locally to mimic.

**`/api/image-edit` returns 500 or “must provide API key”:**
- **`GEMINI_API_KEY`** must be set in **Vercel** → Project Settings → Environment Variables.
- Apply to **Production** (and **Preview** if you use preview deployments for the API).
- Redeploy after changing env vars.

**Vercel doesn’t detect `api/image-edit`:**
- The `api/` folder must be at the project root (or as per your framework). For a Vite + `api/` layout, root `api/image-edit.ts` is standard.
- If you use `vercel.json`, ensure it doesn’t override or exclude `api/`.

**WAF / rate limiting:**
- Vercel WAF is only applied in production. See [cost-security_gcp-vercel.md](./cost-security_gcp-vercel.md) for configuring rate limits on `/api/image-edit`.

### Secrets and Environment Variables

- **GitHub Secrets:** Not needed for the app’s CI or for `GEMINI_API_KEY`. Use them only if you add jobs that need secrets (e.g. E2E).
- **Vercel:** `GEMINI_API_KEY` lives in **Vercel** Project Settings → Environment Variables. Never commit it or put it in `VITE_*` or client bundle.
- **Local:** Use `.env.local` with `GEMINI_API_KEY` and `npm run dev:vercel`; see [start_vercel-deployment-steps.md](./start_vercel-deployment-steps.md).

---

## Next Steps

**Immediate:**
1. ✅ Create `.github/workflows/ci.yml` (use the YAML from Step 1)
2. ✅ Commit and push to trigger CI
3. ✅ In Vercel, import the repo, set `GEMINI_API_KEY`, and deploy
4. ✅ Optionally add a WAF rate-limit rule for `/api/image-edit` ([cost-security_gcp-vercel.md](./cost-security_gcp-vercel.md))

**Later:**
1. **ESLint** — Add `npm run lint` and a `lint` step in CI.
2. **E2E tests** — e.g. Playwright; add a CI job and any needed secrets.
3. **Preview deployments** — Use Vercel’s GitHub integration for PR previews.
4. **Custom domain** — See [Custom Domain Configuration (Vercel)](#custom-domain-configuration-vercel) below.

---

## Custom Domain Configuration (Vercel)

### Overview

You can serve the app from your own domain (e.g. `photo-fun.example.com`) via Vercel. Vercel provides **free SSL** (Let’s Encrypt) and handles renewals.

**Architecture:**
```
User → photo-fun.example.com
         ↓ (DNS: CNAME or A)
       Vercel edge
         ↓
       Your app (frontend + /api/image-edit)
```

### Setup Procedure

1. **Vercel: Add domain**
   - Project → **Settings → Domains**
   - **Add** e.g. `photo-fun.example.com`
   - Vercel will show the required DNS record (often a CNAME to `cname.vercel-dns.com` or an A record).

2. **DNS: Create the record**
   - At your DNS provider (e.g. Cloudflare, Namecheap, Microsoft 365), add:
     - **CNAME:** `photo-fun` (or the subdomain you use) → `cname.vercel-dns.com`  
       **or**
     - **A:** `@` or the subdomain → the IP Vercel gives you.

3. **Verify**
   - In Vercel → Domains, wait for “Valid” (propagation can take minutes to 48 hours).
   - Visit `https://photo-fun.example.com`; SSL is handled by Vercel.

**Vercel docs:** [Add a domain](https://vercel.com/docs/concepts/projects/domains)

### Troubleshooting

**Domain “Invalid” or not resolving:**
- Confirm the CNAME or A record matches exactly what Vercel shows.
- Use [dnschecker.org](https://dnschecker.org) or `dig` to confirm propagation.

**SSL / “Connection not private”:**
- Wait for Vercel to issue the certificate (often a few minutes after DNS is correct).
- Ensure you’re using the domain exactly as added in Vercel (with or without `www` as configured).

---

**Document version:** 1.0  
**Project:** photo-fun5  
**Deployment:** Vercel (GitHub-connected; `api/image-edit` serverless)
