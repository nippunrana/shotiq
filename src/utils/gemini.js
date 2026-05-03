import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";
import { CRICKET_ANALYSIS_PROMPT } from "./prompts";

/**
 * Analyzes a video file using the secure Cloud Function proxy
 * @param {string} videoPath - The path to the video in Firebase Storage
 */
export const analyzeVideo = async (videoPath) => {
  try {
    const analyzeVideoProxy = httpsCallable(functions, 'analyzeVideoProxy');
    
    const result = await analyzeVideoProxy({
      videoPath: videoPath,
      prompt: CRICKET_ANALYSIS_PROMPT
    });

    return result.data.text;
  } catch (error) {
    console.error("Gemini Analysis Error (via Proxy):", error);
    // Extract a more user-friendly error message if available
    const message = error.details?.message || error.message;
    throw new Error(message);
  }
};
