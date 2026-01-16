import { Preset } from './types';

export const PRESETS: Preset[] = [
  {
    id: 'professional',
    label: 'Professional',
    icon: 'briefcase',
    description: 'Polished, high-end studio lighting, sharp focus.',
    prompt: "Transform this into a professional studio portrait. Use soft, flattering studio lighting (like Rembrandt lighting). Smooth the skin texture naturally while keeping all facial features exactly as they are. Blur the background slightly (bokeh) to a neutral, clean studio setting. Ensure the subject looks confident and high-status. PRESERVE IDENTITY AND POSE.",
  },
  {
    id: 'claymation',
    label: 'Claymation',
    icon: 'cube',
    description: 'Stop-motion clay animation style.',
    prompt: "Recreate this image in the style of a stop-motion claymation movie (Aardman style). The subject should look like a sculpted clay figure with fingerprint textures and rounded edges. Use vibrant, playful colors and plastic-like lighting. The background should look like a miniature set. IMPORTANT: Keep the subject's pose and recognizable facial structure.",
  },
  {
    id: 'cyberpunk',
    label: 'Cyberpunk',
    icon: 'zap',
    description: 'Futuristic, neon lights, high contrast.',
    prompt: "Apply a Cyberpunk 2077 aesthetic. Bathe the scene in neon blue, pink, and purple light. Add subtle futuristic tech details to the clothing or background, but do NOT cover the face. Increase contrast and add a cinematic glow. The background should be a rainy, neon-lit futuristic city. Maintain the original camera angle and subject identity.",
  },
  {
    id: 'sketch',
    label: 'Pencil Sketch',
    icon: 'pencil',
    description: 'Artistic charcoal and pencil sketch.',
    prompt: "Convert this photo into a high-quality charcoal and pencil sketch on textured paper. Use strong cross-hatching for shadows. Keep the details of the face sharp and recognizable, while making the clothing and background more loose and artistic. Maintain the original composition.",
  },
];

export const MAX_FILE_SIZE_MB = 10;
export const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/heic'];

export const ERROR_MESSAGES = {
  generic: "Something went wrong. Please try again.",
  security: "Security check failed. Please refresh the page.",
  quota: "Session cost limit reached. Please try again later.",
  fileSize: `File is too large. Max size is ${MAX_FILE_SIZE_MB}MB.`,
};