# Project Development Prompts

This document contains comprehensive prompts used to guide the development of this project, along with summaries of the resulting work.

---

## Chat Session: Initial Setup and TrueFoundry Integration (Claude Sonnet 4.5 / Cursor Agent Mode)

### Original Request

```
This is a prototype of a web app made on aistudio.google.com. Please set it up as a proper Cursor project with any needed MCP servers. This includes initialization of Cursor and also a proper local git repo. I believe I will need to supply you with a Gemini API key in order for it to work properly. The current state of the app is broken in that the web app comes up blank.

Additionally:
- Set up a default image that loads when the app opens (the user provided a portrait image)
- Integrate TrueFoundry AI Gateway as an alternative to direct Google Gemini API calls
- Use TrueFoundry's custom metadata (X-TFY-METADATA header) for cost control via project tracking
- The TrueFoundry endpoint is: sak-consulting:google-gemini:google-gemini
- Fix all documentation and ensure proper setup instructions
- Use www.truefoundry.com/login as the correct dashboard URL
- Implement project tracking using custom metadata (no formal project/ML resource needed)
- Support both TrueFoundry Gateway and direct Gemini API with automatic fallback
```

### Work Completed

#### 1. Project Setup and Git Initialization
- **Initialized git repository** with proper `.gitignore` configuration
- **Created `.cursorrules`** file with project-specific guidelines
- **Set up `main` branch** as the default branch (removed temporary `samkirk` branch)
- **Created comprehensive README.md** with setup instructions

#### 2. Fixed Blank Screen Issue
- **Removed `window.aistudio` dependency** - The app was trying to use AI Studio-specific APIs that don't exist outside of AI Studio
- **Updated `App.tsx`** to check for API keys from environment variables instead
- **Fixed environment variable handling** in `vite.config.ts` to properly expose variables to client code
- **Updated `geminiService.ts`** to read API keys from both Vite env and process.env

#### 3. Default Image Functionality
- **Created `utils/imageLoader.ts`** utility to load images as base64
- **Updated `App.tsx`** to automatically load default image from `/images/default-portrait.jpg` on mount
- **Added loading state** while default image is being fetched
- **Enhanced `ImagePreview.tsx`** with "Replace Image" button to allow users to upload their own images
- **Installed default portrait image** at `public/images/default-portrait.jpg`
- **Maintained all existing functionality**: image upload, download, and processing

#### 4. TrueFoundry AI Gateway Integration
- **Created `services/truefoundryService.ts`** - New service for TrueFoundry API calls
  - Supports OpenAI-compatible API format
  - Handles both image editing and chat completions
  - Automatic error handling and response parsing
- **Updated `services/geminiService.ts`** with automatic TrueFoundry detection
  - Checks for TrueFoundry credentials first
  - Falls back to direct Gemini API if TrueFoundry not configured
  - Maintains backward compatibility
- **Updated `vite.config.ts`** to expose TrueFoundry environment variables
  - `VITE_TRUEFOUNDRY_BASE_URL`
  - `VITE_TRUEFOUNDRY_API_KEY`
  - `VITE_TRUEFOUNDRY_MODEL`
  - `VITE_TRUEFOUNDRY_PROJECT_ID` (for formal projects)
  - `VITE_TRUEFOUNDRY_METADATA_PROJECT_ID` (for custom metadata)

#### 5. Project Tracking via Custom Metadata
- **Implemented `X-TFY-METADATA` header support** for cost control
  - Uses simple string identifier (no formal project needed)
  - Format: `X-TFY-METADATA: {"project_id": "your-identifier"}`
  - Works with budget limiting: `budget_applies_per: ['metadata.project_id']`
- **Maintained support for `x-tfy-project-id` header** for users with formal projects
- **Updated all API calls** to include metadata headers when configured
  - Image editing endpoint
  - Alternative image generation endpoint
  - Chat completions endpoint

#### 6. Documentation
- **Created `docs/TRUEFOUNDRY_SETUP.md`** - Comprehensive setup guide including:
  - Step-by-step API key generation instructions
  - Multiple methods to find/create API keys
  - Base URL configuration
  - Model identifier verification
  - Custom metadata setup (recommended approach)
  - Formal project ID setup (optional)
  - Budget limiting configuration
  - Troubleshooting section
  - API endpoints documentation
- **Updated `README.md`** with:
  - TrueFoundry setup instructions
  - Environment variable options
  - Links to detailed documentation
- **Updated `.env.local.example`** with:
  - Both direct Gemini API and TrueFoundry options
  - Custom metadata project ID (recommended)
  - Formal project ID (optional)
  - Clear comments explaining each option

#### 7. Code Quality and Configuration
- **Fixed duplicate script tags** in `index.html`
- **Updated `.gitignore`** to properly exclude environment files
- **Created helper scripts and documentation** in `scripts/` directory
- **All code passes linting** with no errors
- **Proper TypeScript types** throughout

### Key Features Implemented

1. **Dual API Support**: Automatic detection and fallback between TrueFoundry Gateway and direct Gemini API
2. **Default Image Loading**: App loads with a default portrait image on startup
3. **Image Management**: Users can upload, replace, and download images
4. **Cost Control**: Custom metadata support for budget limiting per project identifier
5. **Comprehensive Documentation**: Step-by-step guides for all setup scenarios
6. **Production Ready**: Proper git setup, environment variable handling, and error handling

### Files Created/Modified

**New Files:**
- `services/truefoundryService.ts` - TrueFoundry Gateway service
- `utils/imageLoader.ts` - Image loading utility
- `docs/TRUEFOUNDRY_SETUP.md` - Comprehensive setup guide
- `public/images/default-portrait.jpg` - Default image
- `public/images/README.md` - Image directory documentation
- `scripts/setup-default-image.md` - Image setup instructions
- `.cursorrules` - Project rules for Cursor
- `.env.local.example` - Environment variable template

**Modified Files:**
- `App.tsx` - Default image loading, TrueFoundry support
- `components/ImagePreview.tsx` - Replace image functionality
- `services/geminiService.ts` - TrueFoundry detection and fallback
- `vite.config.ts` - Environment variable exposure
- `README.md` - Updated setup instructions
- `index.html` - Fixed duplicate script tags
- `.gitignore` - Updated to exclude env files

### Git Commits

1. `9e1d189` - Initial commit: Set up Photo Fun project from AI Studio prototype
2. `d73e122` - Add .env.local.example template file
3. `82cffe1` - Add default image functionality with upload and download support
4. `bc10acd` - Add TrueFoundry AI Gateway integration support
5. `28424cc` - Consolidate TrueFoundry API key documentation
6. `f7e1ea0` - Update README: Remove reference to deleted finding API key guide
7. `64bab50` - Add TrueFoundry project tracking via custom metadata and fix dashboard URLs
8. `4ce2d12` - Update TrueFoundry setup: Use custom metadata for cost control

### Technical Decisions

1. **Custom Metadata Over Formal Projects**: Chose to use `X-TFY-METADATA` header with simple string identifiers instead of requiring formal project creation, making setup much simpler for users.

2. **Automatic Fallback**: Implemented automatic detection - if TrueFoundry is configured, use it; otherwise fall back to direct Gemini API. This provides flexibility without breaking existing setups.

3. **Environment Variable Strategy**: Used Vite's `import.meta.env` with fallback to `process.env` for maximum compatibility.

4. **Default Image on Startup**: Loads default image automatically to provide immediate value to users, while still allowing full customization.

### Result

A fully functional, production-ready React + Vite application for AI-powered photo editing with:
- ✅ Proper git repository setup
- ✅ Working local development environment
- ✅ TrueFoundry AI Gateway integration
- ✅ Cost control via custom metadata
- ✅ Default image functionality
- ✅ Comprehensive documentation
- ✅ Clean, maintainable codebase
