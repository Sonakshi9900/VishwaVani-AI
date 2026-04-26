import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import pkg from '@google-cloud/translate';

dotenv.config();

const { Translate } = pkg.v2;
const router = express.Router();

const geminiKey = process.env.GEMINI_API_KEY; 
const translateKey = process.env.CLOUD_TRANSLATE_KEY; 

if (!geminiKey || !translateKey) {
  console.error("❌ ERROR: Keys are missing in .env file!");
}

const translateClient = new Translate({ key: translateKey });

/**
 * 🛠 Helper: Language Name to Code Converter
 * Added: Bhojpuri (bho) along with others.
 */
const getLanguageCode = (lang) => {
  const languages = {
    'hindi': 'hi',
    'english': 'en',
    'marathi': 'mr',
    'bengali': 'bn',
    'gujarati': 'gu',
    'tamil': 'ta',
    'telugu': 'te',
    'kannada': 'kn',
    'punjabi': 'pa',
    'malayalam': 'ml',
    'urdu': 'ur',
    'bhojpuri': 'bho',
  };
  
  if (!lang) return 'hi'; 
  const lowerLang = lang.toLowerCase().trim();
  return languages[lowerLang] || lowerLang;
};

// 🔥 Gemini Utility Function (Using Gemini 3.1 Flash Lite Preview)
const callGemini = async (prompt) => {
  try {
    const model = "gemini-3.1-flash-lite-preview"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Gemini API Error:", data.error?.message);
      throw new Error(data.error?.message || "Invalid API Key or Setup");
    }

    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text.replace(/\*/g, '');
    } else {
      return "AI response structure was unexpected.";
    }

  } catch (error) {
    console.error("❌ AI ERROR:", error.message);
    throw error;
  }
};

// 🌍 1. Translation Route
router.post("/translate", async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    if (!text || !targetLanguage) return res.status(400).json({ error: "Missing fields" });

    const langCode = getLanguageCode(targetLanguage);
    console.log(`📡 Cloud Translation: [${langCode}]`);

    let [translation] = await translateClient.translate(text, langCode);
    
    const cleanTranslation = translation ? translation.replace(/\*/g, '') : "";
    res.json({ translation: cleanTranslation });

  } catch (error) {
    console.error("❌ TRANSLATE ERROR:", error.message);
    res.status(500).json({ error: "Translation failed", details: error.message });
  }
});

// 📝 2. Summarize Route
router.post("/summarize", async (req, res) => {
  try {
    const { text, language } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    const prompt = `Summarize the following document in ${language || 'English'} with bullet points: ${text.substring(0, 4000)}`;
    const result = await callGemini(prompt);
    res.json({ summary: result });
  } catch (error) {
    res.status(500).json({ error: "Summarization failed", details: error.message });
  }
});

// 🤖 3. Chat Assistant Route
router.post("/chat", async (req, res) => {
  try {
    const { message, context, language } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const prompt = `
    You are 'VishwaVani AI'. Answer in ${language || "English"}.
    Context: ${context?.substring(0, 4000) || "No document provided."}
    Question: ${message}
    `;

    const result = await callGemini(prompt);
    res.json({ reply: result });
  } catch (error) {
    res.status(500).json({ error: "Chat failed", details: error.message });
  }
});

export default router;
