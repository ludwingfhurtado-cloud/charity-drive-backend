

import { GoogleGenAI } from "@google/genai";
import { Language } from '../types';

// IMPORTANT: To use the AI features, you must add your Gemini API key to your .env file
// Get your key from Google AI Studio: https://aistudio.google.com/app/apikey
// Example: VITE_GEMINI_API_KEY=your_gemini_api_key_here
const GEMINI_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY;

// Initialize the AI client only if the key is present.
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

const getLanguageName = (lang: Language) => {
    switch (lang) {
        case 'es': return 'Spanish';
        case 'pt': return 'Brazilian Portuguese';
        default: return 'English';
    }
}

const getDefaultMessage = (amount: number, language: Language) => {
    if (language === 'es') {
        return `¡Tu viaje por Bs. ${amount.toFixed(2)} está confirmado! Tu conductor ya está en camino.`;
    }
    if (language === 'pt') {
        return `Sua viagem de Bs. ${amount.toFixed(2)} está confirmada! Seu motorista está a caminho.`;
    }
    return `Your ride for Bs. ${amount.toFixed(2)} is confirmed! Your driver is on the way.`;
}

export const getConfirmationMessage = async (amount: number, language: Language): Promise<string> => {
    if (!ai) {
        console.warn("Gemini API key not found. Using default confirmation message.");
        return getDefaultMessage(amount, language);
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Write a short, friendly confirmation message in ${getLanguageName(language)} for a user who just booked a ride for $${amount.toFixed(2)}. Mention the ride is confirmed and on its way. Keep it under 40 words.`,
            config: {
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error generating confirmation message:", error);
        return getDefaultMessage(amount, language);
    }
};