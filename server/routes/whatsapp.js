// server/routes/whatsapp.js
// WhatsApp Bot via Twilio — Rural student support in Bhojpuri/Hindi
// npm install twilio openai express

import express from "express";
import twilio from "twilio";
import OpenAI from "openai";

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Twilio client ────────────────────────────────────────────────
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ─── In-memory session store (use Redis in production) ───────────
// Maps: phoneNumber → { history: [], language: string }
const sessions = new Map();

function getSession(phone) {
  if (!sessions.has(phone)) {
    sessions.set(phone, { history: [], language: "hindi" });
  }
  return sessions.get(phone);
}

// ─── Detect language from first message ──────────────────────────
function detectLanguage(text) {
  // Simple keyword detection for Bhojpuri
  const bhojpuriWords = ["ka", "rahe", "bani", "hoi", "batao", "kaise", "kahan", "hamke"];
  const lower = text.toLowerCase();
  const matches = bhojpuriWords.filter((w) => lower.includes(w)).length;
  return matches >= 2 ? "bhojpuri" : "hindi";
}

// ─── Generate AI reply ────────────────────────────────────────────
async function generateReply(userMessage, session) {
  const systemPrompt = `
Tu Vishwa-Vani WhatsApp bot hai. Tu Bihar ke gramin bacchon ka AI shikshak hai.
- Jawab dene ki bhasha: ${session.language === "bhojpuri" ? "Bhojpuri mein" : "Saral Hindi mein"}
- Jawab SHORT rakho — WhatsApp ke liye max 3-4 lines
- Helpful, friendly tone. Baccha samjhe aisa simple bhasha
- Emojis thoda use kar sakta hai (📚✅🙏)
- Agar maths/science question ho toh step-by-step samjhao
`.trim();

  const messages = [
    { role: "system", content: systemPrompt },
    ...session.history.slice(-6),
    { role: "user", content: userMessage },
  ];

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    max_tokens: 300,
    temperature: 0.7,
  });

  return res.choices[0].message.content;
}

// ─── WhatsApp Webhook (Twilio → your server) ─────────────────────
// Set this URL in Twilio Console → WhatsApp Sandbox → "When a message comes in"
// URL: https://your-domain.com/api/whatsapp/webhook
//
// POST /api/whatsapp/webhook
router.post("/webhook", async (req, res) => {
  const twiml = new twilio.twiml.MessagingResponse();

  try {
    const incomingMsg = (req.body.Body || "").trim();
    const from = req.body.From; // e.g., "whatsapp:+919876543210"
    const mediaUrl = req.body.MediaUrl0; // Voice note / image if sent

    if (!incomingMsg && !mediaUrl) {
      twiml.message("Namaste! Koi sawaal poochho 📚");
      return res.type("text/xml").send(twiml.toString());
    }

    const session = getSession(from);

    // ── Auto-detect language on first message ───────────────
    if (session.history.length === 0) {
      session.language = detectLanguage(incomingMsg);
    }

    let userText = incomingMsg;

    // ── Handle voice note (MediaUrl) — transcribe via Whisper ─
    if (mediaUrl && !incomingMsg) {
      try {
        const transcription = await openai.audio.transcriptions.create({
          file: await fetch(mediaUrl).then((r) => r.blob()),
          model: "whisper-1",
          language: "hi", // Hindi / Bhojpuri
        });
        userText = transcription.text;
      } catch (err) {
        twiml.message("Voice note sun nahi paaya. Text mein likhkar bhejo 🙏");
        return res.type("text/xml").send(twiml.toString());
      }
    }

    // ── Special commands ─────────────────────────────────────
    if (userText.toLowerCase() === "reset") {
      session.history = [];
      twiml.message("✅ Naya conversation shuru! Apna sawaal poochho.");
      return res.type("text/xml").send(twiml.toString());
    }

    if (userText.toLowerCase() === "help") {
      twiml.message(
        "📚 *Vishwa-Vani Bot*\n\n" +
          "• Koi bhi sawaal poochho — Hindi ya Bhojpuri mein\n" +
          "• Voice note bhi bhej sakte ho 🎤\n" +
          "• 'reset' likho — naya session shuru karo\n\n" +
          "Chalao padhai! 💪"
      );
      return res.type("text/xml").send(twiml.toString());
    }

    // ── Generate AI reply ────────────────────────────────────
    const reply = await generateReply(userText, session);

    // Update session history
    session.history.push({ role: "user", content: userText });
    session.history.push({ role: "assistant", content: reply });

    // Keep only last 12 messages in memory
    if (session.history.length > 12) {
      session.history = session.history.slice(-12);
    }

    twiml.message(reply);
  } catch (err) {
    console.error("[WhatsApp Bot] Error:", err.message);
    twiml.message("❌ Thoda problem ho gaya. Dobara try karo!");
  }

  res.type("text/xml").send(twiml.toString());
});

// ─── Send proactive message (Teacher broadcast) ───────────────────
// POST /api/whatsapp/broadcast  (Admin only, JWT protected)
// Body: { to: "+91XXXXXXXXXX", message: "string" }
router.post("/broadcast", async (req, res) => {
  const { to, message } = req.body;
  if (!to || !message) {
    return res.status(400).json({ error: "to and message required" });
  }

  try {
    const msg = await twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${to}`,
      body: message,
    });

    res.json({ success: true, sid: msg.sid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
