// server/utils/authMiddleware.js
// JWT verify + RBAC middleware
// Tumhare existing utils/ folder mein daalo (jahan gemini.js hai)
// npm install jsonwebtoken

import jwt from "jsonwebtoken";

// ─── Roles ────────────────────────────────────────────────────────
export const ROLES = {
  STUDENT: "student",
  TEACHER: "teacher",
  ADMIN: "admin",
};

// ─── verifyToken ──────────────────────────────────────────────────
// Usage:  router.get('/route', verifyToken, handler)
export function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: "Token required. Pehle login karo." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, name, email, role }
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expire ho gaya. Dobara login karo." });
    }
    return res.status(403).json({ error: "Invalid token." });
  }
}

// ─── requireRole ──────────────────────────────────────────────────
// Usage:  router.get('/admin', verifyToken, requireRole('teacher','admin'), handler)
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Allowed roles: ${allowedRoles.join(", ")}`,
      });
    }
    next();
  };
}
