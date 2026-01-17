import { GoogleGenAI } from "@google/genai";
import { editImageWithTrueFoundry } from './truefoundryService';

/**
 * Edit image with Gemini - supports both TrueFoundry Gateway and direct Google API
 */
export const editImageWithGemini = async (
  imageBase64: string, 
  prompt: string
): Promise<{ image?: string; text?: string }> => {
  // Check if TrueFoundry is configured
  const truefoundryBaseUrl = import.meta.env.VITE_TRUEFOUNDRY_BASE_URL || (process.env.TRUEFOUNDRY_BASE_URL as string);
  const truefoundryApiKey = import.meta.env.VITE_TRUEFOUNDRY_API_KEY || (process.env.TRUEFOUNDRY_API_KEY as string);
  
  if (truefoundryBaseUrl && truefoundryApiKey) {
    // Use TrueFoundry Gateway
    return editImageWithTrueFoundry(imageBase64, prompt);
  }

  // Fallback to direct Google API
  // Try Vite env first, then fallback to process.env
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (process.env.API_KEY as string) || (process.env.GEMINI_API_KEY as string);
  if (!apiKey) {
    throw new Error('Neither TrueFoundry nor Gemini API key is set. Please set TRUEFOUNDRY_BASE_URL and TRUEFOUNDRY_API_KEY, or GEMINI_API_KEY in .env.local');
  }
  const ai = new GoogleGenAI({ apiKey });

  const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|webp|heic);base64,/, '');

  const enforcementPrompt = `
    TASK: Edit the provided image based on the USER INSTRUCTION below.
    
    STRICT RULES:
    1. Identity Preservation: You MUST maintain the core identity, facial features, and key characteristics of the main subject. The person must remain recognizable.
    2. Composition: Preserve the original image's angle, pose, and composition unless explicitly told to change it.
    3. Creativity: If a style is requested, apply it vividly and artistically.
    4. Output: Generate a high-quality, visually striking image.

    USER INSTRUCTION: ${prompt}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { text: enforcementPrompt },
          { inlineData: { mimeType: mimeType, data: cleanBase64 } },
        ],
      },
    });

    let generatedImage: string | undefined;
    let generatedText: string | undefined;

    const candidate = response.candidates?.[0];
    
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          generatedImage = `data:image/png;base64,${part.inlineData.data}`;
        } else if (part.text) {
          generatedText = part.text;
        }
      }
    }

    if (!generatedImage && !generatedText) {
      throw new Error("No content generated.");
    }

    return { image: generatedImage, text: generatedText };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const chatWithGemini = async (history: {role: string, text: string}[], newMessage: string) => {
    // Check if TrueFoundry is configured
    const truefoundryBaseUrl = import.meta.env.VITE_TRUEFOUNDRY_BASE_URL || (process.env.TRUEFOUNDRY_BASE_URL as string);
    const truefoundryApiKey = import.meta.env.VITE_TRUEFOUNDRY_API_KEY || (process.env.TRUEFOUNDRY_API_KEY as string);
    
    if (truefoundryBaseUrl && truefoundryApiKey) {
      // Use TrueFoundry Gateway
      const { chatWithTrueFoundry } = await import('./truefoundryService');
      return await chatWithTrueFoundry(history, newMessage);
    }

    // Fallback to direct Google API
    // Try Vite env first, then fallback to process.env
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (process.env.API_KEY as string) || (process.env.GEMINI_API_KEY as string);
    if (!apiKey) {
      throw new Error('Neither TrueFoundry nor Gemini API key is set. Please set TRUEFOUNDRY_BASE_URL and TRUEFOUNDRY_API_KEY, or GEMINI_API_KEY in .env.local');
    }
    const ai = new GoogleGenAI({ apiKey });
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        history: history.map(h => ({
            role: h.role,
            parts: [{ text: h.text }]
        }))
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text;
}