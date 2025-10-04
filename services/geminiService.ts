

import { GoogleGenAI } from "@google/genai";
import { Language } from '../types';

// This check was removed as it crashed the app on startup if the key wasn't present.
// The SDK will handle the missing key more gracefully on API calls.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getLanguageName = (lang: Language) => {
    switch (lang) {
        case 'es': return 'Spanish';
        case 'pt': return 'Brazilian Portuguese';
        default: return 'English';
    }
}

export const getConfirmationMessage = async (amount: number, language: Language): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Write a short, friendly confirmation message in ${getLanguageName(language)} for a user who just booked a ride for $${amount.toFixed(2)}. Mention the ride is confirmed and on its way. Keep it under 40 words.`,
            config: {
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        // FIX: The `.text` attribute on the response is a property, not a function.
        return response.text;
    } catch (error) {
        console.error("Error generating confirmation message:", error);
        if (language === 'es') {
            return `¡Tu viaje por $${amount.toFixed(2)} está confirmado! Tu conductor ya está en camino.`;
        }
        if (language === 'pt') {
            return `Sua viagem de $${amount.toFixed(2)} está confirmada! Seu motorista está a caminho.`;
        }
        return `Your ride for $${amount.toFixed(2)} is confirmed! Your driver is on the way.`;
    }
};