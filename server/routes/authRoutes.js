// server/routes/authRoutes.js
// Login, token refresh, aur /me endpoint
// Tumhare existing routes/ folder mein daalo (jahan aiRoutes.js hai)
// npm install jsonwebtoken bcryptjs

import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { verifyToken } from "../utils/authMiddleware.js";

const router = express.Router();

// ─── User store (MongoDB se replace karo production mein) ──────────
// Abhi ke liye in-memory — apna password yahan set karo
const USERS = [
  {
    id: "t1",
    name: "Teacher",
    email: "teacher@vishwavani.in",
    // bcrypt hash of "teacher123" — change karo apne password ka
    passwordHash: "$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
    role: "teacher",
  },
  {
    id: "a1",
    name: "Admin",
    email: "admin@vishwavani.in",
    // bcrypt hash of "admin123"
    passwordHash: "$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
    role: "admin",
  },
];

// ─── POST /api/auth/login ──────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email aur password dono chahiye." });
  }

  const user = USERS.find((u) => u.email === email.toLowerCase().trim());

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: "Email ya password galat hai." });
  }

  const payload = { id: user.id, name: user.name, email: user.email, role: user.role };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  res.json({
    token,
    refreshToken,
    user: { id: user.id, name: user.name, role: user.role },
  });
});

// ─── POST /api/auth/refresh ────────────────────────────────────────
router.post("/refresh", (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token chahiye." });
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );
    const newToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({ token: newToken });
  } catch {
    res.status(403).json({ error: "Refresh token invalid ya expire." });
  }
});

// ─── GET /api/auth/me  (login check) ──────────────────────────────
router.get("/me", verifyToken, (req, res) => {
  res.json({ user: req.user });
});

export default router;
