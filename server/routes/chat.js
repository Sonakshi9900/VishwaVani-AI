// server/routes/chat.js
// SSE Streaming + RAG (Retrieval-Augmented Generation) for Bihar Board Syllabus
// npm install express openai @pinecone-database/pinecone pdf-parse multer

import express from "express";
import OpenAI from "openai"; // or use Gemini SDK
import { Pinecone } from "@pinecone-database/pinecone";

const router = express.Router();

// ─── Init AI client ───────────────────────────────────────────────
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Init Pinecone ────────────────────────────────────────────────
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.index("vishwa-vani-syllabus");

// ─── Embed a query using OpenAI embeddings ────────────────────────
async function embedQuery(text) {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return res.data[0].embedding;
}

// ─── RAG: Retrieve relevant syllabus chunks ───────────────────────
async function retrieveSyllabusContext(query, topK = 4) {
  try {
    const queryEmbedding = await embedQuery(query);
    const results = await index.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
    });

    const chunks = results.matches
      .filter((m) => m.score > 0.7) // Only relevant chunks
      .map((m) => m.metadata?.text || "")
      .join("\n\n");

    return chunks;
  } catch (err) {
    console.error("[RAG] Vector search failed:", err.message);
    return ""; // Graceful fallback — answer without RAG
  }
}

// ─── SSE Streaming Chat Endpoint ─────────────────────────────────
// POST /api/chat/stream
// Body: { message: string, history: [{role, content}], language: "hindi"|"bhojpuri" }
router.post("/stream", async (req, res) => {
  const { message, history = [], language = "hindi" } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: "Message required" });
  }

  // ── Set SSE headers ──────────────────────────────────────────
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  // Helper to send SSE event
  const send = (data) => {
    res.write(`data: ${data}\n\n`);
  };

  try {
    // ── 1. RAG: Fetch relevant syllabus context ───────────────
    const syllabusContext = await retrieveSyllabusContext(message);

    const systemPrompt = `
Tu Vishwa-Vani hai — ek AI shikshak jo Bihar ke gramin ilakon mein bacchon ko unki 
apni bhasha mein padhata hai.

NIYAM:
- Jawab dene ki bhasha: ${language === "bhojpuri" ? "Bhojpuri" : "Saral Hindi"}
- Jawab simple, easy aur clear hona chahiye
- Agar Bihar Board syllabus se question ho toh syllabus context use karo
- Agar context na mile, tab general knowledge se jawab do
- Bacchon ko encourage karo — positive tone rakho

${syllabusContext ? `BIHAR BOARD SYLLABUS CONTEXT:\n${syllabusContext}` : ""}
`.trim();

    // ── 2. Build message history for API ─────────────────────
    const apiMessages = [
      ...history.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    // ── 3. Stream response from LLM ──────────────────────────
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, ...apiMessages],
      stream: true,
      max_tokens: 800,
      temperature: 0.7,
    });

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content;
      if (token) {
        // Escape newlines for SSE format
        send(token.replace(/\n/g, "\\n"));
      }
    }

    send("[DONE]");
    res.end();
  } catch (err) {
    console.error("[Chat Stream] Error:", err.message);
    send("❌ Server error. Thodi der baad dobara try karein.");
    send("[DONE]");
    res.end();
  }
});

// ─── Upload Syllabus PDF → Embed → Store in Pinecone ─────────────
// POST /api/chat/upload-syllabus  (Admin only, JWT protected)
import multer from "multer";
import pdfParse from "pdf-parse";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.post("/upload-syllabus", upload.single("pdf"), async (req, res) => {
  // JWT middleware should protect this route (see auth.js)
  if (!req.file) return res.status(400).json({ error: "PDF file required" });

  try {
    const data = await pdfParse(req.file.buffer);
    const fullText = data.text;

    // Chunk text into ~500-word segments
    const words = fullText.split(/\s+/);
    const CHUNK_SIZE = 500;
    const chunks = [];
    for (let i = 0; i < words.length; i += CHUNK_SIZE) {
      chunks.push(words.slice(i, i + CHUNK_SIZE).join(" "));
    }

    // Embed each chunk and upsert to Pinecone
    const vectors = [];
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await embedQuery(chunks[i]);
      vectors.push({
        id: `syllabus-${Date.now()}-chunk-${i}`,
        values: embedding,
        metadata: {
          text: chunks[i],
          source: req.file.originalname,
          chapter: i + 1,
        },
      });
    }

    await index.upsert(vectors);

    res.json({
      success: true,
      chunksIndexed: chunks.length,
      file: req.file.originalname,
    });
  } catch (err) {
    console.error("[Syllabus Upload] Error:", err.message);
    res.status(500).json({ error: "PDF processing failed" });
  }
});

export default router;
