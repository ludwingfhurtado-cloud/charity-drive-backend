/**
 * geminiService.ts
 * -----------------
 * Handles AI confirmations and text generation using Gemini or a mock fallback.
 * Used for trip confirmations, charity suggestions, etc.
 */

import axios from "axios";

// Environment variable or hardcoded key (for local testing)
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "YOUR_GEMINI_API_KEY_HERE";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

/**
 * Sends a prompt to the Gemini API and returns the generated text.
 * If the API fails, returns a safe fallback message.
 */
export async function getConfirmationMessage(prompt: string): Promise<string> {
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    const text =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response from Gemini service.";

    return text.trim();
  } catch (error: any) {
    console.error("❌ Gemini API error:", error.message || error);
    return "Could not connect to AI confirmation service. Please try again later.";
  }
}
