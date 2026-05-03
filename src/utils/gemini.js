import { GoogleGenerativeAI } from "@google/generative-ai";
import { CRICKET_ANALYSIS_PROMPT } from "./prompts";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Converts a File object to a base64 string compatible with Gemini API
 */
const fileToGenerativePart = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Analyzes a video file using Gemini 3 Flash Thinking
 */
export const analyzeVideo = async (file) => {
  if (!API_KEY || API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
    throw new Error("Gemini API Key is not configured. Please add it to your .env file.");
  }

  try {
    // Using Gemini 3 Flash Preview as identified in the search
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      generationConfig: {
        thinkingConfig: {
          thinkingLevel: "HIGH"
        }
      }
    });

    const videoPart = await fileToGenerativePart(file);
    const prompt = CRICKET_ANALYSIS_PROMPT;

    const result = await model.generateContent([prompt, videoPart]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
