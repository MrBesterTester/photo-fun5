/**
 * Edit image with Gemini using secure serverless API route
 * API key is kept secure on the server side
 */
export const editImageWithGemini = async (
  imageBase64: string,
  prompt: string,
  captchaToken?: string
): Promise<{ image?: string; text?: string }> => {
  try {
    const response = await fetch('/api/image-edit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
        prompt,
        captchaToken: captchaToken || '',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      const errorMessage = errorData.error || `API request failed with status ${response.status}`;

      // Handle specific error cases
      if (response.status === 401) {
        throw new Error('Invalid or missing API key on server');
      }
      if (response.status === 403) {
        throw new Error('CAPTCHA verification failed. Please complete the CAPTCHA and try again.');
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    return { image: data.image, text: data.text };

  } catch (error) {
    console.error("Image edit API Error:", error);
    throw error;
  }
};

// Note: chatWithGemini is currently unused by the app
// If needed in the future, it should be updated to use a secure API route
// similar to editImageWithGemini, rather than calling Gemini directly from the client
export const chatWithGemini = async (history: {role: string, text: string}[], newMessage: string) => {
    // This function is not currently used and would need to be refactored
    // to use a secure API route if chat functionality is added
    throw new Error('chatWithGemini is not implemented. Chat functionality would require a secure API route.');
}