import { GoogleGenAI, Modality, Part } from "@google/genai";

// Utility to convert a file to a base64 string
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

// Utility to convert a file directly to a Part for the GenAI API
export const fileToGenerativePart = async (file: File): Promise<Part> => {
    const base64 = await fileToBase64(file);
    return {
        inlineData: {
            data: base64,
            mimeType: file.type,
        },
    };
}

// Utility to convert a data URL string to a Part for the GenAI API
export const dataUrlToGenerativePart = (dataUrl: string): Part => {
    const match = dataUrl.match(/^data:(.*);base64,(.*)$/);
    if (!match) {
        throw new Error("Invalid data URL format");
    }
    const mimeType = match[1];
    const base64 = match[2];

    return {
        inlineData: {
            data: base64,
            mimeType: mimeType,
        },
    };
};


export const generateProductPlacement = async (
  scenePart: Part,
  productPart: Part | null,
  prompt: string
): Promise<string> => {
  try {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable is not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const instructionText = `Your task is to act as a photorealistic image editor. You will be given a base image and a text instruction. You might also be given a second 'product' image.

**Instructions:**
1.  **Analyze the Base Image:** The first image is your canvas. If it already contains a placed product from a previous step, you will be editing this composite image.
2.  **Handle the Product Image (if provided):** If a second image is given, your primary task is to isolate the main product from it (e.g., a shirt, a sofa). You must **completely disregard the background or any models** in the product image. Then, seamlessly place this isolated product into the base image according to the user's prompt.
3.  **Execute the User's Prompt:** Apply the user's text instruction to the image. This instruction is the most important part. It could be about initial placement, moving an object, changing colors, applying a stylistic look (e.g., 'Golden Hour'), or any other edit. The prompt is: "${prompt}".
4.  **Maintain Realism:** All edits must result in a photorealistic image. Ensure lighting, shadows, perspective, and scale are believable and consistent. The final product should look like a real photograph.

Output only the final, edited image.`;

    const parts = [scenePart];
    if (productPart) {
      parts.push(productPart);
    }
    parts.push({ text: instructionText });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: { parts: parts },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });
    
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
      }
    }

    // Check for safety blocks or other non-image responses
    const textResponse = response.text?.trim();
    if (textResponse) {
        throw new Error(`Model returned a text response instead of an image: "${textResponse}" This might be due to a safety policy or an inability to fulfill the request.`);
    }

    throw new Error("No image was generated in the response. The model may have refused the request.");

  } catch (error) {
    console.error("Error generating product placement:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate image: ${error.message}`);
    }
    throw new Error("An unknown error occurred during image generation.");
  }
};