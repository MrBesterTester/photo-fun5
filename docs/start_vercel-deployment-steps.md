# Vercel Deployment and Local Development - Next Steps

## Step 1: Ensure Your API Key is Set Up

Make sure you have a `.env.local` file with your Gemini API key:
```bash
GEMINI_API_KEY=your_actual_api_key_here
```

If you don't have `.env.local` yet:
```bash
# Create it from the example (if it exists) or create it manually
# Then add your API key
```

## Step 2: Start the Development Server

Run:
```bash
npm run dev:vercel
```

## Step 3: First-Time Vercel CLI Setup (if prompted)

If this is your first time using Vercel CLI:
- It will open a browser window for authentication
- Log in to your Vercel account (or create one if needed)
- Follow the prompts to link your project

## Step 4: Access Your App

Once it's running:
- Open `http://localhost:3000` in your browser
- The API route will be available at `http://localhost:3000/api/image-edit`
- The app should show "Ready" in the header if your API key is configured correctly

## What to Expect

- Vercel CLI will detect your `api/` directory automatically
- It will run both the Vite frontend and the serverless API route
- Environment variables from `.env.local` will be loaded automatically
- You'll see logs for both the frontend and API route

## For Production Deployment

1. **Deploy to Vercel** (via GitHub integration or `vercel deploy`)
2. **Set `GEMINI_API_KEY` in Vercel Project Settings → Environment Variables**
   - The API key is kept secure on the server side and never exposed to the browser
   - All Gemini API calls happen through the secure `/api/image-edit` serverless route
