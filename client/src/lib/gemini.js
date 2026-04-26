import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI = null;
let model = null;

export const initializeGemini = (apiKey) => {
    genAI = new GoogleGenerativeAI(apiKey);
    // Using the user-requested gemini-2.5-flash model
    model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
};

export const translateText = async (text, language) => {
    if (!model) throw new Error("Gemini not initialized. Please set your API key.");
    const prompt = `Translate the following text to ${language}. Provide ONLY the translation. Ensure it sounds natural and accurate.\n\nText:\n${text}`;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Translation Error:", error);
        throw new Error("Failed to translate text: " + (error.message || String(error)));
    }
};

export const summarizeAndExplainText = async (text, language) => {
    if (!model) throw new Error("Gemini not initialized. Please set your API key.");
    const prompt = `You are an expert AI assistant. Please provide:\n1. A brief summary of the text.\n2. A simple explanation of the core concepts.\n\nRespond entirely in ${language}. Use clear structure and bullet points where appropriate.\n\nText:\n${text}`;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Summary Error:", error);
        throw new Error("Failed to summarize and explain text: " + (error.message || String(error)));
    }
};
