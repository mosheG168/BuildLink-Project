import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
  registerSchema,
  validateUser,
} from "../validators/users.validation.js";

const router = Router();

const signToken = (user) =>
  jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

// POST /api/users/register
router.post("/register", validateUser(registerSchema), async (req, res) => {
  try {
    const { name, phone, email, password, image, address, isBusiness } =
      req.body;

    // unique email
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists)
      return res.status(409).json({ error: "Email already registered" });

    // hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    //? role convention if we want to enforce it:
    // const role = isBusiness ? "contractor" : "worker";
    // For now, let's keep default 'worker' from model
    const user = await User.create({
      name,
      phone,
      email: email.toLowerCase(),
      passwordHash,
      image,
      address,
      isBusiness,
      // role, // ← we can uncomment if we want the automatic mapping
    });

    const token = signToken(user);
    res.setHeader("x-auth-token", token);
    res.status(201).json({
      message: "Registered successfully",
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        isBusiness: user.isBusiness,
        role: user.role,
      },
      token,
    });
  } catch (e) {
    if (e.code === 11000 && e.keyPattern?.email) {
      return res.status(409).json({ error: "Email already registered" });
    }
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
