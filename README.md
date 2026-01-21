<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Photo Fun - Expert AI Editor

A React-based web application for AI-powered photo editing using Google's Gemini API. Transform your photos with various artistic styles and custom prompts.

## Features

- 🎨 Multiple preset styles (Professional, Claymation, Cyberpunk, Pencil Sketch)
- 💬 Custom prompt-based editing
- 📸 Image upload with drag & drop support
- 🔄 Compare original vs edited images
- 💾 Download edited images

## Prerequisites

- Node.js (v18 or higher recommended)
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

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
   - Get your API key from: https://aistudio.google.com/app/apikey

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

- `GEMINI_API_KEY` - Your Google Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

## Troubleshooting

- **Blank screen:** Make sure you've created `.env.local` with a valid `GEMINI_API_KEY`
- **API errors:** Verify your API key is correct and has proper permissions
- **Build errors:** Try deleting `node_modules` and running `npm install` again

## License

This project was originally created in Google AI Studio and has been adapted for local development.


