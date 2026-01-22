import { AspectRatio, GenerationResult, ImageStyle } from '../types';

declare var process: any;

// Custom Error class for handling service-specific issues
export class ServiceError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
  }
}

// Helper to get API Key (User Settings > Env Var)
const getApiKey = (): string | null => {
  const storedKey = localStorage.getItem('keyn_groq_key');
  if (storedKey && storedKey.trim().length > 0) {
    return storedKey.trim();
  }
  return process.env.API_KEY || null;
};

/**
 * Maps AspectRatio enum to width and height dimensions.
 */
const getDimensions = (ratio: AspectRatio): { width: number, height: number } => {
  switch (ratio) {
    case AspectRatio.PORTRAIT: return { width: 768, height: 1280 };
    case AspectRatio.LANDSCAPE: return { width: 1280, height: 768 };
    case AspectRatio.WIDE: return { width: 1024, height: 768 };
    case AspectRatio.TALL: return { width: 768, height: 1024 };
    case AspectRatio.SQUARE:
    default: return { width: 1024, height: 1024 };
  }
};

/**
 * Uses Groq (Llama 3) to enhance the user's simple prompt based on a specific style.
 */
export const enhancePrompt = async (userPrompt: string, style: ImageStyle = 'None'): Promise<string> => {
  const apiKey = getApiKey();

  if (!navigator.onLine) {
    throw new ServiceError("No internet connection. Cannot enhance prompt.", "NETWORK_ERROR");
  }

  if (!apiKey) {
    throw new ServiceError("Groq API Key is missing. Please add it in Settings.", "API_KEY_MISSING");
  }

  const styleInstruction = style !== 'None' 
    ? `The user specifically wants the image to have a "${style}" art style. Ensure the enhanced prompt strictly adheres to this aesthetic, adding relevant keywords for ${style}.` 
    : "Enhance the prompt to be highly detailed and artistic.";

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are an expert AI image prompt engineer. Your task is to take a simple user description and rewrite it into a highly detailed, artistic, and descriptive prompt suitable for a high-quality text-to-image model (Flux). Focus on lighting, texture, style, and composition. ${styleInstruction} Output ONLY the enhanced prompt text. Do not add conversational filler.`
          },
          {
            role: "user",
            content: `Enhance this image description: "${userPrompt}"`
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      if (response.status === 401) throw new ServiceError("Invalid API Key. Please check the key in Settings.", "AUTH_ERROR");
      if (response.status === 429) throw new ServiceError("Rate limit exceeded. Please wait a moment.", "RATE_LIMIT");
      if (response.status >= 500) throw new ServiceError("Groq server error. Try again later.", "SERVER_ERROR");
      throw new ServiceError(`Groq API Error: ${response.status}`, "UNKNOWN_ERROR");
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || userPrompt;
  } catch (error: any) {
    if (error instanceof ServiceError) throw error;
    // Handle fetch network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
       throw new ServiceError("Network connection failed during enhancement.", "NETWORK_ERROR");
    }
    console.error("Failed to enhance prompt with Groq:", error);
    throw new ServiceError("Unexpected error during prompt enhancement.", "PROCESSING_ERROR");
  }
};

/**
 * Generates an image using Pollinations (Flux Model).
 */
export const generateImageContent = async (
  prompt: string, 
  aspectRatio: AspectRatio,
  skipEnhancement: boolean = false,
  style: ImageStyle = 'None'
): Promise<GenerationResult> => {
  let finalPrompt = prompt;
  let warning: string | undefined;

  // 1. Enhance Prompt (with graceful degradation)
  if (!skipEnhancement) {
    try {
      finalPrompt = await enhancePrompt(prompt, style);
    } catch (error: any) {
      console.warn("Enhancement failed, using original prompt:", error);
      
      // Determine user-friendly warning message
      if (error.code === 'API_KEY_MISSING') {
         warning = "API Key missing. Using original prompt. Add key in Settings.";
      } else if (error.code === 'AUTH_ERROR') {
         warning = "Invalid API Key in Settings. Using original prompt.";
      } else if (error.code === 'RATE_LIMIT') {
         warning = "Enhancement rate limit reached. Generated using original prompt.";
      } else if (error.code === 'NETWORK_ERROR') {
         warning = "Network issues detected. Tried generating with original prompt.";
      } else {
         warning = "Prompt enhancement failed. Generated using original prompt.";
      }
      
      // Fallback to original prompt, but try to append style manually if enhancement failed
      if (style !== 'None') {
          finalPrompt = `${prompt}, ${style} style, high quality`;
      } else {
          finalPrompt = prompt;
      }
    }
  }
    
  // 2. Generate Image URL
  if (!navigator.onLine) {
     throw new ServiceError("You are offline. Please check your internet connection.", "NETWORK_ERROR");
  }

  try {
    const { width, height } = getDimensions(aspectRatio);
    const seed = Math.floor(Math.random() * 1000000000);
    const encodedPrompt = encodeURIComponent(finalPrompt);
    
    // Pollinations URL structure
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;

    // 3. Pre-fetch to validate and convert to blob
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
        throw new ServiceError("Image generation service is currently unavailable.", "IMAGE_SERVICE_ERROR");
    }
    
    const blob = await response.blob();
    
    // Pollinations sometimes returns text/html on error instead of an image
    if (blob.type.includes('text') || blob.type.includes('html')) {
        throw new ServiceError("The model could not process this prompt. Please try a different description.", "CONTENT_FILTER");
    }

    const blobUrl = URL.createObjectURL(blob);

    return { 
      imageUrl: blobUrl,
      originalUrl: imageUrl,
      textResponse: finalPrompt,
      warning
    };

  } catch (error: any) {
    if (error instanceof ServiceError) throw error;
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new ServiceError("Failed to download generated image. Check your connection.", "NETWORK_ERROR");
    }
    console.error("Generation Error:", error);
    throw new ServiceError("An unexpected error occurred during image generation.", "IMAGE_GEN_ERROR");
  }
};