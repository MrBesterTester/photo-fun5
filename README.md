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
   - The app will show "Ready" in the header when the API key is properly configured, or "Not Ready" if it's missing or invalid

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   - The app will be available at `http://localhost:3000`

## Project Structure

```
photo-fun5/
├── components/          # React components
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

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Environment Variables

- `GEMINI_API_KEY` - Your Google Gemini API key. The app displays a status indicator in the header showing "Ready" when the key is configured correctly, or "Not Ready" if it's missing or invalid.

## Troubleshooting

- **Blank screen:** Make sure you've created `.env.local` with a valid `GEMINI_API_KEY`
- **API errors:** Verify your API key is correct and has proper permissions
- **Build errors:** Try deleting `node_modules` and running `npm install` again

## License

This project was originally created in Google AI Studio and has been adapted for local development.


