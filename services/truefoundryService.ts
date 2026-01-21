/**
 * TrueFoundry AI Gateway Service
 * 
 * This service uses TrueFoundry's AI Gateway to proxy requests to Google Gemini.
 * 
 * To get your TrueFoundry credentials:
 * 1. Go to TrueFoundry Dashboard → AI Gateway → Models
 * 2. Your base URL is typically: https://api.truefoundry.com or https://{workspace}.api.truefoundry.com
 * 3. Generate a Personal Access Token (PAT) from Settings → API Keys
 * 4. Your model identifier format: {workspace}:{provider}:{model-name}
 *    Example: sak-consulting:google-gemini:google-gemini
 */

interface TrueFoundryConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  projectId?: string; // For x-tfy-project-id header (if using formal project)
  metadataProjectId?: string; // For X-TFY-METADATA header (simpler, no formal project needed)
}

const getTrueFoundryConfig = (): TrueFoundryConfig | null => {
  const baseUrl = import.meta.env.VITE_TRUEFOUNDRY_BASE_URL || (process.env.TRUEFOUNDRY_BASE_URL as string);
  const apiKey = import.meta.env.VITE_TRUEFOUNDRY_API_KEY || (process.env.TRUEFOUNDRY_API_KEY as string);
  const model = import.meta.env.VITE_TRUEFOUNDRY_MODEL || (process.env.TRUEFOUNDRY_MODEL as string) || 'sak-consulting:google-gemini:google-gemini';
  const projectId = import.meta.env.VITE_TRUEFOUNDRY_PROJECT_ID || (process.env.TRUEFOUNDRY_PROJECT_ID as string);
  // Use metadata project ID if set, otherwise fall back to projectId for backward compatibility
  const metadataProjectId = import.meta.env.VITE_TRUEFOUNDRY_METADATA_PROJECT_ID || (process.env.TRUEFOUNDRY_METADATA_PROJECT_ID as string) || projectId;

  if (!baseUrl || !apiKey) {
    return null;
  }

  return { baseUrl, apiKey, model, projectId, metadataProjectId };
};

/** In dev, use /tfy proxy (Vite) to avoid CORS. In prod, use TRUEFOUNDRY_BASE_URL. */
const getApiBase = (baseUrl: string) =>
  import.meta.env.DEV ? '/tfy' : baseUrl.replace(/\/$/, '');

/**
 * Edit image using TrueFoundry AI Gateway (Gemini proxy)
 */
export const editImageWithTrueFoundry = async (
  imageBase64: string,
  prompt: string
): Promise<{ image?: string; text?: string }> => {
  const config = getTrueFoundryConfig();
  
  if (!config) {
    throw new Error('TrueFoundry configuration not found. Please set TRUEFOUNDRY_BASE_URL and TRUEFOUNDRY_API_KEY in .env.local');
  }

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

  const apiBase = getApiBase(config.baseUrl);

  try {
    // TrueFoundry uses OpenAI-compatible API format for Gemini
    // In dev, /tfy is proxied to api.truefoundry.com to avoid CORS
    const endpoint = `${apiBase}/api/llm/api/inference/openai/v1/chat/completions`;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    };

    // Add project ID header if configured (for formal project tracking)
    if (config.projectId) {
      headers['x-tfy-project-id'] = config.projectId;
    }

    // Add custom metadata with project_id for cost control and observability
    // This doesn't require a formal project - just a string identifier
    // Can be used with budget limiting: budget_applies_per: ['metadata.project_id']
    if (config.metadataProjectId) {
      headers['X-TFY-METADATA'] = JSON.stringify({
        project_id: config.metadataProjectId
      });
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: enforcementPrompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${cleanBase64}`,
                  detail: 'low'  // reduces size/tokens; use 'high' if quality suffers
                }
              }
            ]
          }
        ],
        // Gemini-specific parameters
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const body = errorText.trim() || '(no response body)';
      const hint = response.status === 500
        ? ' — For image editing, set TRUEFOUNDRY_MODEL to an image model (e.g. gemini-2.5-flash-image), not a chat-only model (e.g. gemini-2.5-flash). See AI Gateway → Models.'
        : '';
      throw new Error(`TrueFoundry API error: ${response.status} ${response.statusText} - ${body}${hint}`);
    }

    const data = await response.json();
    
    // Parse the response - TrueFoundry returns OpenAI-compatible format
    let generatedImage: string | undefined;
    let generatedText: string | undefined;

    if (data.choices && data.choices[0]?.message?.content) {
      const content = data.choices[0].message.content;
      
      // Check if content is an array (multimodal response)
      if (Array.isArray(content)) {
        for (const item of content) {
          if (item.type === 'image_url' && item.image_url?.url) {
            generatedImage = item.image_url.url;
          } else if (item.type === 'text') {
            generatedText = item.text;
          }
        }
      } else if (typeof content === 'string') {
        generatedText = content;
      }
    }

    // If no image in response, try alternative endpoint for image generation
    if (!generatedImage && !generatedText) {
      const imageEndpoint = `${apiBase}/api/llm/api/inference/openai/v1/images/edits`;
      
      const imageHeaders: Record<string, string> = {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'multipart/form-data',
      };

      // Add project ID header if configured (for formal project tracking)
      if (config.projectId) {
        imageHeaders['x-tfy-project-id'] = config.projectId;
      }

      // Add custom metadata with project_id for cost control
      if (config.metadataProjectId) {
        imageHeaders['X-TFY-METADATA'] = JSON.stringify({
          project_id: config.metadataProjectId
        });
      }

      const imageResponse = await fetch(imageEndpoint, {
        method: 'POST',
        headers: imageHeaders,
        body: JSON.stringify({
          model: config.model,
          prompt: enforcementPrompt,
          image: cleanBase64,
          n: 1,
          size: '1024x1024',
        }),
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        if (imageData.data && imageData.data[0]?.url) {
          generatedImage = imageData.data[0].url;
        }
      }
    }

    if (!generatedImage && !generatedText) {
      throw new Error("No content generated from TrueFoundry.");
    }

    return { image: generatedImage, text: generatedText };

  } catch (error) {
    console.error("TrueFoundry API Error:", error);
    throw error;
  }
};

/**
 * Chat with Gemini via TrueFoundry
 */
export const chatWithTrueFoundry = async (
  history: { role: string; text: string }[],
  newMessage: string
): Promise<string> => {
  const config = getTrueFoundryConfig();
  
  if (!config) {
    throw new Error('TrueFoundry configuration not found. Please set TRUEFOUNDRY_BASE_URL and TRUEFOUNDRY_API_KEY in .env.local');
  }

  const apiBase = getApiBase(config.baseUrl);

  try {
    const endpoint = `${apiBase}/api/llm/api/inference/openai/v1/chat/completions`;

    const messages = [
      ...history.map(h => ({
        role: h.role === 'model' ? 'assistant' : h.role,
        content: h.text
      })),
      {
        role: 'user',
        content: newMessage
      }
    ];

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    };

    // Add project ID header if configured (for formal project tracking)
    if (config.projectId) {
      headers['x-tfy-project-id'] = config.projectId;
    }

    // Add custom metadata with project_id for cost control and observability
    // This doesn't require a formal project - just a string identifier
    // Can be used with budget limiting: budget_applies_per: ['metadata.project_id']
    if (config.metadataProjectId) {
      headers['X-TFY-METADATA'] = JSON.stringify({
        project_id: config.metadataProjectId
      });
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const body = errorText.trim() || '(no response body)';
      throw new Error(`TrueFoundry API error: ${response.status} ${response.statusText} - ${body}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0]?.message?.content) {
      return data.choices[0].message.content;
    }

    throw new Error('No response content from TrueFoundry');
  } catch (error) {
    console.error("TrueFoundry Chat Error:", error);
    throw error;
  }
};
