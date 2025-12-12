import { GoogleGenAI, Type, Modality } from "@google/genai";
import { NutritionalData } from "../types";

// Helper to get the client with the current key
const getGenAIClient = (): GoogleGenAI => {
  const apiKey = localStorage.getItem('gemini_api_key');

  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  return new GoogleGenAI({ apiKey });
};

/**
 * Analyzes an image to extract nutritional information.
 * @param base64Image The image data
 * @param userHint Optional text if the user corrects the AI (e.g. "This is actually a burger")
 */
export const analyzeFoodImage = async (base64Image: string, userHint?: string): Promise<NutritionalData> => {
  const ai = getGenAIClient();
  const modelId = "gemini-2.5-flash"; // Good balance of speed and reasoning
  
  let promptText = `
    Analyze this food image. 
    Use the hand in the image (if present) as a reference for portion size.
    Estimate the following values for the visible portion:
    - Name of the dish/item
    - Total Calories (kcal)
    - Glycemic Index (GI)
    - Glycemic Load (GL)
    - Total Carbohydrates (g)
    - Protein (g)
    - A brief, friendly summary (max 2 sentences) describing the food and its health impact, spoken as if to a friend.
  `;

  if (userHint) {
    promptText = `
      The user indicated that the previous analysis was incorrect. 
      The user states that this food is: "${userHint}".
      
      Based on this new information, re-analyze the image and portion size strictly for "${userHint}".
      Recalculate:
      - Total Calories (kcal)
      - Glycemic Index (GI)
      - Glycemic Load (GL)
      - Total Carbohydrates (g)
      - Protein (g)
      - Update the summary to reflect this specific food.
    `;
  }

  const response = await ai.models.generateContent({
    model: modelId,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image
          }
        },
        { text: promptText }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          foodName: { type: Type.STRING },
          calories: { type: Type.NUMBER },
          gi: { type: Type.NUMBER },
          gl: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          summary: { type: Type.STRING },
        },
        required: ["foodName", "calories", "gi", "gl", "carbs", "protein", "summary"]
      }
    }
  });

  if (!response.text) {
    throw new Error("No data returned from Gemini");
  }

  return JSON.parse(response.text) as NutritionalData;
};

/**
 * Generates a recipe or chat response based on text input.
 */
export const getChatResponse = async (history: string[], userMessage: string): Promise<string> => {
  const ai = getGenAIClient();
  const modelId = "gemini-2.5-flash";
  
  const systemInstruction = `
    You are a helpful nutritionist and chef AI. 
    Your goal is to help the user eat healthy.
    If the user asks for a recipe, provide a creative idea based on low GI/GL principles if possible, or tailored to their request.
    Keep responses concise (under 100 words) so they can be easily spoken aloud.
    All measurement units must be in metric units, like grams and ml.
  `;

  // Construct a simple history context
  const context = history.join("\n");
  const fullPrompt = `${context}\nUser: ${userMessage}\nAI:`;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: fullPrompt,
    config: {
      systemInstruction: systemInstruction,
    }
  });

  return response.text || "I'm not sure how to answer that.";
};

/**
 * Converts text to speech using Gemini TTS.
 */
export const generateSpeech = async (text: string): Promise<string> => {
  const ai = getGenAIClient();
  // Using the specialized TTS model
  const modelId = "gemini-2.5-flash-preview-tts";

  const response = await ai.models.generateContent({
    model: modelId,
    contents: [
      {
        parts: [{ text: text }]
      }
    ],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: "Aoede" } // Friendly, clear voice
        }
      }
    }
  });

  const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  
  if (!audioData) {
    throw new Error("No audio data generated");
  }

  return audioData;
};