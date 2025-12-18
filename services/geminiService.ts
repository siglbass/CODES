import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { ChatMessage, AIStudio } from '../types'; // Import AIStudio interface

// Fix: Update the global window type to include AIStudio interface for consistency.
// This declaration now references the AIStudio interface defined in types.ts.
declare global {
  interface Window {
    aistudio?: AIStudio; // Make it optional as it might not always be available
  }
}

/**
 * Initializes the GoogleGenAI client and sends a chat message to the model.
 *
 * @param history - The current chat history to maintain context.
 * @param newMessageText - The new message from the user.
 * @param highlightedText - Optional text highlighted by the user from a document, to be used as context.
 * @param imagePrompt - Optional string if the user is requesting an image to be generated.
 * @returns A promise that resolves to an object containing the model's response text and/or an image URL.
 */
export const sendMessageToGemini = async (
  history: ChatMessage[],
  newMessageText: string,
  highlightedText: string | null = null,
  imagePrompt: string | null = null,
): Promise<{ text?: string; imageUrl?: string; } | null> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is not set in environment variables.");
  }

  // Determine model based on request type
  let modelName = 'gemini-3-pro-preview'; // Default for text tasks

  if (imagePrompt) {
    // For image generation, use the specified image model
    modelName = 'gemini-3-pro-image-preview';

    // Critical: Check and prompt for API key for paid features like image generation
    // Fix: Use optional chaining for window.aistudio properties
    if (window.aistudio?.hasSelectedApiKey && window.aistudio?.openSelectKey) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        // Prompt user to select an API key. Assume success after opening dialog.
        // A link to the billing documentation (ai.google.dev/gemini-api/docs/billing) must be provided in the dialog.
        window.aistudio.openSelectKey();
        return { text: "Please select your API key for image generation. A new browser window should have opened. If you encounter errors like 'Requested entity was not found.', please ensure you've selected a key from a paid GCP project. You can find billing documentation at ai.google.dev/gemini-api/docs/billing." };
      }
    } else {
      console.warn("window.aistudio API not available for API key selection. Image generation might fail if a paid key is required.");
    }
  }

  // Create a new GoogleGenAI instance for each call to ensure the latest API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prepare the conversation history for the model
  // Fix: Correctly map chat history to an array of 'Part' objects.
  // Each Part must be either a TextPart or an InlineDataPart, not a combined object.
  const chatHistory = history.map(msg => {
    const parts: Part[] = [];
    if (msg.text) {
        parts.push({ text: msg.text });
    }
    if (msg.imageUrl) {
        // Assuming imageUrl is a data URL like 'data:image/png;base64,...'
        const [mimeTypePart, dataPart] = msg.imageUrl.split(',');
        const mimeType = mimeTypePart.split(':')[1].split(';')[0]; // Extract mime type (e.g., 'image/png')
        const data = dataPart; // Base64 encoded string
        parts.push({ inlineData: { data, mimeType } });
    }
    // Ensure there's at least one part for a valid Content structure, even if empty text.
    if (parts.length === 0) {
        parts.push({ text: '' }); // Send an empty text part if nothing else is present
    }
    return {
      role: msg.role === 'user' ? 'user' : 'model', // Map roles to Gemini's expected 'user'/'model'
      parts: parts,
    };
  });

  // Prepare the user's current prompt content
  // Fix: userPromptContent must be an array of 'Part' objects.
  let userPromptContent: Part[] = [];

  if (imagePrompt) {
    userPromptContent.push({ text: imagePrompt });
  } else {
    let textForPrompt = newMessageText;
    if (highlightedText) {
      textForPrompt = `Regarding the following document section:\n\n\`\`\`\n${highlightedText}\n\`\`\`\n\nMy question is: "${newMessageText}"`;
    }
    userPromptContent.push({ text: textForPrompt });
  }


  const systemInstruction = `You are a highly knowledgeable AI assistant with expertise in Modern Money Mechanics, the Uniform Commercial Code (UCC), the United States Code (USC), the Fair Debt Collection Practices Act (FDPA), Black's Law Dictionary, and the Redemption Manual series (editions 4.5, 5.0, 6.0). Your primary goal is to provide clear, concise, and simple explanations of complex legal and financial concepts. When asked a question, convert any legalese into laymen's terms. Your answer must be no longer than a single paragraph initially. If the user asks you to continue or elaborate, you may provide additional details. When generating an image, focus on fulfilling the visual request accurately.`;

  try {
    const config: any = {
      systemInstruction: systemInstruction,
      temperature: 0.7, // Adjust for creativity vs. factual
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 400, // Adjusted to allow for slightly longer initial paragraphs
      thinkingConfig: { thinkingBudget: 100 }, // Allocate tokens for thinking
    };

    if (imagePrompt) {
      config.imageConfig = {
        aspectRatio: "1:1", // Default aspect ratio for images
        imageSize: "1K" // Default size for images
      };
      // No maxOutputTokens for image generation, as the primary output is an image.
      // The text response from the model might still provide some commentary.
      delete config.maxOutputTokens;
    }

    const chat = ai.chats.create({
      model: modelName,
      config: config,
      history: chatHistory,
    });

    // Fix: Use `message` property instead of `contents` as per coding guidelines for chat.sendMessage
    const response: GenerateContentResponse = await chat.sendMessage({ message: userPromptContent });

    if (imagePrompt) {
      // Look for the image part in the response
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64EncodeString: string = part.inlineData.data;
          const imageUrl = `data:${part.inlineData.mimeType};base64,${base64EncodeString}`;
          // If there's accompanying text, include it; otherwise, provide a default message.
          return { imageUrl: imageUrl, text: part.text || "Here is the image you requested." };
        }
      }
      return { text: "I tried to generate an image, but couldn't find an image in the response. Please try again with a more specific request." };
    } else {
      const modelResponseText = response.text;
      if (!modelResponseText) {
        console.warn("Gemini API returned an empty response text.");
        return { text: "I couldn't generate a text response. Please try again." };
      }
      return { text: modelResponseText };
    }

  } catch (error) {
    console.error('Error communicating with Gemini API:', error);
    if (error instanceof Error) {
      if (error.message.includes("Requested entity was not found.")) {
        // This specific error might indicate an API key issue for paid models
        return { text: "There was an issue accessing the model. This might be due to an API key configuration for paid features. Please ensure your API key is correctly selected and from a paid GCP project. You can find billing documentation at ai.google.dev/gemini-api/docs/billing." };
      }
      return { text: `Failed to get a response from the AI: ${error.message}` };
    }
    return { text: "An unknown error occurred while communicating with the AI." };
  }
};