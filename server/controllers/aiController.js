import { callGemini } from "../utils/gemini.js";

export const translateText = async (req, res) => {
  try {
    const { text, targetLang } = req.body;

    const prompt = `Translate the following text into ${targetLang}:\n${text}`;

    const result = await callGemini(prompt);

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const summarizeText = async (req, res) => {
  try {
    const { text } = req.body;

    const prompt = `Summarize this in simple words:\n${text}`;

    const result = await callGemini(prompt);

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};