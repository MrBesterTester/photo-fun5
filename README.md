# Photo Fun - Expert AI Editor

A React-based web application for AI-powered photo editing using Google's Gemini API. Transform your photos with various artistic styles and custom prompts.

**Try it out at [https://photo-fun5.samkirk.com](https://photo-fun5.samkirk.com)**

## Features

- 🎨 Multiple preset styles (Professional, Claymation, Cyberpunk, Pencil Sketch)
- 💬 Custom prompt-based editing
- 📸 Image upload with drag & drop support
- 🔄 Compare original vs edited images
- 💾 Download edited images

## Prerequisites

- Node.js (v18 or higher recommended)
- A Gemini API key
- Vercel CLI (for local development with API routes)

## Setup Instructions

1. **Clone or navigate to the project directory:**
   ```bash
   cd photo-fun5
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up your API key:**
   - Copy `.env.local.example` to `.env.local`:
     ```bash
     cp .env.local.example .env.local
     ```
   - Open `.env.local` and add your Gemini API key:
     ```
     GEMINI_API_KEY=your_actual_api_key_here
     ```
   - **Note:** For local development, the API key is read from `.env.local`. For production (Vercel), set `GEMINI_API_KEY` in Vercel Project Settings → Environment Variables.
   - The app will show "Ready" in the header when the API key is properly configured, or "Not Ready" if it's missing or invalid

4. **Run the development server:**
   
   **Important:** This app uses serverless API routes that require Vercel CLI for local development.
   
   ```bash
   npm run dev:vercel
   ```
   
   This will:
   - Start the Vite development server for the frontend
   - Run the serverless API route (`/api/image-edit`) locally
   - Automatically read environment variables from `.env.local`
   
   **First time setup:** If this is your first time using Vercel CLI, it will prompt you to log in. Follow the instructions to authenticate.

5. **Open your browser:**
   - The app will be available at `http://localhost:3000`
   - The API route will be available at `http://localhost:3000/api/image-edit`

## Project Structure

```
photo-fun5/
├── api/                # Serverless API routes
│   └── image-edit.ts  # Secure API route for Gemini image editing
├── components/         # React components
│   ├── ChatInterface.tsx
│   ├── Header.tsx
│   ├── ImagePreview.tsx
│   └── ImageUploader.tsx
├── services/           # API services
│   └── geminiService.ts
├── App.tsx            # Main app component
├── index.tsx          # Entry point
├── vite.config.ts     # Vite configuration
└── package.json       # Dependencies
```

## Available Scripts

- `npm run dev:vercel` - Start development server with Vercel CLI (required for API routes to work locally)
- `npm run dev` - Start Vite dev server only (API routes won't work - use `dev:vercel` instead)
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Environment Variables

### Local Development (`.env.local`)
- `GEMINI_API_KEY` - Your Google Gemini API key for local development. The app displays a status indicator in the header showing "Ready" when the key is configured correctly, or "Not Ready" if it's missing or invalid.

### Production (Vercel)
- Set `GEMINI_API_KEY` in **Vercel Project Settings → Environment Variables**
- The API key is kept secure on the server side and never exposed to the browser
- All Gemini API calls happen through the secure `/api/image-edit` serverless route

## Troubleshooting

- **Blank screen:** Make sure you've created `.env.local` with a valid `GEMINI_API_KEY`
- **API route not working locally:** Make sure you're using `npm run dev:vercel` instead of `npm run dev`. The API routes require Vercel CLI to run locally.
- **Vercel CLI not found:** Install it globally with `npm install -g vercel` or use the local version via `npm run dev:vercel` (it's included as a dev dependency)
- **API errors:** Verify your API key is correct and has proper permissions
- **Build errors:** Try deleting `node_modules` and running `npm install` again

## License

This project was originally created in Google AI Studio and has been adapted for local development.


