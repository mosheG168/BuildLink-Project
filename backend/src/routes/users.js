// routes/users.js
// Page purpose: Defines user-facing auth endpoints (register, login, me).
// Secures inputs with Joi, limits requests to reduce brute force,
// signs JWTs on success, and implements simple lockout on repeated failures.

import { Router } from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
  validateUser,
  registerSchema,
  loginSchema,
} from "../validators/users.validation.js";
import auth from "../middleware/auth.js";

const router = Router();

/** ---------- Helpers ---------- */

// Small helper to sign the JWT with essential claims.
// sub = subject (user id), plus role/email/isBusiness for quick authz checks on the client.
const signToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      email: user.email,
      isBusiness: user.isBusiness,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" } // refresh cadence: 7 days
  );

// Ensure we never leak sensitive fields and keep response consistent.
const serializeUser = (u) => ({
  id: u._id,
  name: u.name,
  phone: u.phone,
  email: u.email,
  isBusiness: u.isBusiness,
  role: u.role,
  image: u.image,
  address: u.address,
});

// Normalize email (trim + lowercase) in a single, reusable function.
const normalizeEmail = (e) =>
  String(e || "")
    .trim()
    .toLowerCase();

/** Rate limit register/login to reduce brute force */
// 50 attempts per 10 minutes per IP (adjust as needed).
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});

/** ---------- REGISTER ---------- */
// POST /api/users/register
// Flow: validate -> check duplicate email -> hash password -> create user -> sign token -> return (header + body)
router.post(
  "/register",
  authLimiter,
  validateUser(registerSchema),
  async (req, res, next) => {
    try {
      const { name, phone, email, password, image, address, isBusiness } =
        req.body;

      // Check unique email (stored lowercased in DB)
      const lowered = normalizeEmail(email);
      const exists = await User.findOne({ email: lowered });
      if (exists)
        return res.status(409).json({ error: "Email already registered" });

      // Salt & hash the password (no plain passwords in DB)
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Optional: role mapping from isBusiness (kept as comment for future rules)
      // const role = isBusiness ? "contractor" : "worker";

      // Create the user document
      const user = await User.create({
        name,
        phone,
        email: lowered,
        passwordHash,
        image,
        address,
        isBusiness,
        // role,
      });

      // Sign a JWT and return it in both header and body for convenience
      const token = signToken(user);
      res.setHeader("x-auth-token", token);
      return res.status(201).json({
        message: "Registered successfully",
        user: serializeUser(user),
        token,
      });
    } catch (e) {
      // Handle duplicate-key at DB level too (race conditions)
      if (e?.code === 11000 && e?.keyPattern?.email) {
        return res.status(409).json({ error: "Email already registered" });
      }
      next(e);
    }
  }
);

/** ---------- LOGIN ---------- */
// POST /api/users/login
// Flow: validate -> find user -> check lockout -> verify password -> update counters -> sign token
router.post(
  "/login",
  authLimiter,
  validateUser(loginSchema),
  async (req, res, next) => {
    try {
      const email = normalizeEmail(req.body.email);
      const { password } = req.body;

      const invalid = "Invalid email or password"; // generic to prevent user enumeration
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ error: invalid });

      // Lockout: if lockUntil is in the future, inform how many minutes remain
      if (user.lockUntil && user.lockUntil > Date.now()) {
        const mins = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60));
        return res
          .status(403)
          .json({ error: `Account locked. Try again in ${mins} minute(s)` });
      }

      // Compare provided password with stored hash
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        // Increment fail counter and lock after 3 failed attempts
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        if (user.failedLoginAttempts >= 3) {
          user.lockUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h lock
        }
        await user.save();

        // If we just locked, return a clear message
        if (user.lockUntil && user.lockUntil > Date.now()) {
          return res.status(403).json({
            error:
              "Account locked for 24 hours due to multiple failed login attempts",
          });
        }
        return res.status(400).json({ error: invalid });
      }

      // On success: reset counters + remove lock
      if (user.failedLoginAttempts || user.lockUntil) {
        user.failedLoginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();
      }

      // Issue JWT and return sanitized user
      const token = signToken(user);
      res.setHeader("x-auth-token", token);
      return res.json({ token, user: serializeUser(user) });
    } catch (e) {
      next(e);
    }
  }
);

// GET /api/users/me
// Protected route: returns the current user based on JWT (Authorization: Bearer ... or x-auth-token)
router.get("/me", auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.sub).select("-passwordHash");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user); // sanitized by select/toJSON transform
  } catch (e) {
    next(e);
  }
});

export default router;
