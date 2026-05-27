// server/index.js

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import dotenv from "dotenv";
dotenv.config();

// ─── Route imports ────────────────────────────────────────────────
import aiRoutes from "./routes/aiRoutes.js";
import chatRoutes from "./routes/chat.js";
import whatsappRoutes from "./routes/whatsapp.js";
import authRouter from "./routes/authRoutes.js";
import { verifyToken, requireRole } from "./utils/authMiddleware.js";

const app = express();

// ─── Security Middleware ──────────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: [
    "https://vishwa-vani-ai.vercel.app",
    "http://localhost:5173",
  ],
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

// ─── Rate Limiting ────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests. 15 min baad try karo." },
  standardHeaders: true,
  legacyHeaders: false,
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: "Chat limit reached. Thoda ruko 🙏" },
});

app.use("/api", apiLimiter);

// ─── Routes ───────────────────────────────────────────────────────
app.use("/api/ai", aiRoutes);              // tumhara existing AI route
app.use("/api/auth", authRouter);          // login, refresh, me
app.use("/api/chat", chatLimiter, chatRoutes);     // SSE streaming
app.use("/api/whatsapp", whatsappRoutes);  // Twilio WhatsApp bot

// ─── Protected Admin Route ────────────────────────────────────────
app.get(
  "/api/admin/analytics",
  verifyToken,
  requireRole("teacher", "admin"),
  (req, res) => {
    res.json({
      totalStudents: 1842,
      totalQuestions: 12409,
      activeToday: 318,
      avgResponseTime: "1.4s",
      topTopics: [
        { topic: "Fractions", count: 2340, trend: "up" },
        { topic: "Photosynthesis", count: 1890, trend: "up" },
        { topic: "Hindi Grammar", count: 1540, trend: "steady" },
      ],
    });
  }
);

// ─── Health Check ─────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    version: process.env.npm_package_version || "1.0.0",
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ─── Global Error Handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[Server Error]", err.message);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message,
  });
});

// ─── Start Server ──────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 Vishwa-Vani Backend running on port ${PORT}`);
  console.log(`🤖 AI Routes: ✅`);
  console.log(`🔐 Auth (JWT + RBAC): ✅`);
  console.log(`📚 RAG Chat: ${process.env.PINECONE_API_KEY ? "✅" : "⚠️ Pinecone key missing"}`);
  console.log(`📱 WhatsApp Bot: ${process.env.TWILIO_ACCOUNT_SID ? "✅" : "⚠️ Twilio key missing"}\n`);
});

export default app;