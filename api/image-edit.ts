import { GoogleGenAI } from "@google/genai";

/**
 * Serverless API route for image editing with Gemini
 * Keeps API key secure on the server side
 * 
 * Vercel serverless function using Web Standard API (Request/Response)
 */
export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const { imageBase64, prompt } = body;

    // Validate input
    if (!imageBase64 || !prompt) {
      return Response.json(
        { error: 'Missing required fields: imageBase64 and prompt' },
        { status: 400 }
      );
    }

    // Get API key from server-side environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: 'Gemini API key is not configured on the server' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // Parse image data
    const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|webp|heic);base64,/, '');

    // Build enforcement prompt
    const enforcementPrompt = `
    TASK: Edit the provided image based on the USER INSTRUCTION below.
    
    STRICT RULES:
    1. Identity Preservation: You MUST maintain the core identity, facial features, and key characteristics of the main subject. The person must remain recognizable.
    2. Composition: Preserve the original image's angle, pose, and composition unless explicitly told to change it.
    3. Creativity: If a style is requested, apply it vividly and artistically.
    4. Output: Generate a high-quality, visually striking image.

    USER INSTRUCTION: ${prompt}
  `;

    // Call Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { text: enforcementPrompt },
          { inlineData: { mimeType: mimeType, data: cleanBase64 } },
        ],
      },
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
        imageConfig: {
          imageSize: '2K', // Use 2K resolution to balance quality and cost (~$0.134/image vs $0.24 for 4K)
        },
        generationConfig: {
          maxOutputTokens: 512, // Limit output tokens to control costs per request
        },
      },
    });

    // Parse response
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
      return Response.json(
        { error: "No content generated from Gemini API." },
        { status: 500 }
      );
    }

    // Return success response
    return Response.json({ image: generatedImage, text: generatedText });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Handle specific error cases
    const errorMessage = error?.message || error?.toString?.() || String(error);
    
    if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("API key")) {
      return Response.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }
    
    if (errorMessage.includes("quota") || errorMessage.includes("429")) {
      return Response.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Generic error
    return Response.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
