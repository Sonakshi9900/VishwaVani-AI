import axios from "axios";

export const callGemini = async (prompt) => {
  const API_KEY = process.env.GEMINI_API_KEY;

  console.log("ENV CHECK:", API_KEY); // 👈 debug

  if (!API_KEY) {
    throw new Error("Gemini not initialized. Please set your API key.");
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }
    );

    return response.data.candidates[0].content.parts[0].text;

  } catch (error) {
    console.error("Gemini API Error:", error.response?.data || error.message);
    throw new Error("Gemini API failed");
  }
};
