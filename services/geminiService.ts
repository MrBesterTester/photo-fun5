import { GoogleGenAI } from "@google/genai";

export const editImageWithGemini = async (
  imageBase64: string, 
  prompt: string
): Promise<{ image?: string; text?: string }> => {
  // Try Vite env first, then fallback to process.env
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (process.env.API_KEY as string) || (process.env.GEMINI_API_KEY as string);
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Please create a .env.local file with your API key.');
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
    // Try Vite env first, then fallback to process.env
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (process.env.API_KEY as string) || (process.env.GEMINI_API_KEY as string);
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set. Please create a .env.local file with your API key.');
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