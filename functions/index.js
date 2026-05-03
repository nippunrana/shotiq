const { onCall } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();

// Set global options to us-central1
setGlobalOptions({ region: "us-central1" });

/**
 * Analyzes a video stored in Firebase Storage using Gemini.
 * Expects { videoPath: "videos/..." }
 * Using v2 syntax for modern deployment.
 */
exports.analyzeVideoProxy = onCall({
  secrets: ["GEMINI_API_KEY"],
  timeoutSeconds: 300,
  memory: "1GiB",
}, async (request) => {
  const videoPath = request.data.videoPath;
  const prompt = request.data.prompt;

  if (!videoPath || !prompt) {
    const { HttpsError } = require("firebase-functions/v2/https");
    throw new HttpsError("invalid-argument", "Missing videoPath or prompt.");
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    const { HttpsError } = require("firebase-functions/v2/https");
    throw new HttpsError("failed-precondition", "GEMINI_API_KEY secret is not configured.");
  }

  try {
    // 1. Get the file from Firebase Storage
    const bucket = admin.storage().bucket();
    const file = bucket.file(videoPath);
    
    const [metadata] = await file.getMetadata();
    const [buffer] = await file.download();

    // 2. Initialize Gemini
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", // Using standard flash model name
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    // 3. Prepare generative part
    const videoPart = {
      inlineData: {
        data: buffer.toString("base64"),
        mimeType: metadata.contentType || "video/mp4"
      }
    };

    // 4. Generate content
    const result = await model.generateContent([prompt, videoPart]);
    const response = await result.response;
    
    return {
      text: response.text()
    };

  } catch (error) {
    console.error("Gemini Proxy Error:", error);
    const { HttpsError } = require("firebase-functions/v2/https");
    throw new HttpsError("internal", error.message);
  }
});

