// middleware/auth.js
// Page purpose: Verifies JWT from either x-auth-token header or Authorization: Bearer ...,
// attaches the payload to req.user, or returns 401 on failure.

import jwt from "jsonwebtoken";

export default function auth(req, res, next) {
  try {
    // Support both header styles for flexibility
    const bearer = req.get("Authorization");
    const xToken = req.get("x-auth-token");
    const token =
      xToken || (bearer?.startsWith("Bearer ") ? bearer.slice(7) : null);

    if (!token) return res.status(401).json({ error: "Missing token" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // payload contains: { sub, role, email, isBusiness, iat, exp }
    req.user = payload;
    next();
  } catch (_err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
