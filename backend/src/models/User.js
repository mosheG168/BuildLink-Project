// models/User.js
// Page purpose: Defines the User schema used by auth and profile flows.
// Notes:
// - Keep DB schema permissive (simple strings/numbers); enforce format in Joi validators.
// - Passwords are stored as passwordHash (never plaintext) and stripped from JSON responses.
// - Includes simple brute-force protection fields (failedLoginAttempts, lockUntil).

import mongoose from "mongoose";

// Consider centralizing ROLES in a shared constants file to reuse across model + validators.
const ROLES = ["worker", "subcontractor", "contractor", "admin"];

// ----- Subdocuments (embedded) -----
const nameSub = new mongoose.Schema(
  {
    first: { type: String, required: true, trim: true },
    middle: { type: String, default: "", trim: true },
    last: { type: String, required: true, trim: true },
  },
  { _id: false } // no separate _id for the subdocument
);

const imageSub = new mongoose.Schema(
  {
    url: { type: String, default: "" },
    alt: { type: String, default: "" },
  },
  { _id: false }
);

const addressSub = new mongoose.Schema(
  {
    state: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    houseNumber: { type: Number, required: true },
    zip: { type: Number, required: true }, // keep Number to match existing data
  },
  { _id: false }
);

// ----- Main schema -----
const userSchema = new mongoose.Schema(
  {
    // Basic profile
    name: { type: nameSub, required: true },
    phone: { type: String, required: true, trim: true }, // format enforced by Joi (Israeli pattern)
    email: {
      type: String,
      required: true,
      unique: true, // creates a unique index (see syncIndexes note below)
      lowercase: true, // stored normalized
      trim: true,
      index: true,
    },

    // Auth
    passwordHash: { type: String, required: true }, // bcrypt hash only

    // Optional profile fields
    image: { type: imageSub, default: () => ({}) },
    address: { type: addressSub, required: true },

    // Business/role flags
    isBusiness: { type: Boolean, required: true },
    role: { type: String, enum: ROLES, default: "worker" },

    // Brute-force protection
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
  },
  {
    timestamps: true, // createdAt / updatedAt
    toJSON: {
      // Ensure sensitive/internal fields are never leaked in API responses
      transform: (_doc, ret) => {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Ensure unique email (helps if schema changes or during re-builds)
userSchema.index({ email: 1 }, { unique: true });

// Extra guard: normalize email on assignment
userSchema.path("email").set((v) => (v ? v.trim().toLowerCase() : v));

// Export model
const User = mongoose.model("User", userSchema);
export default User;

/*
Deployment notes:
- If you added/changed indexes, run `await User.syncIndexes()` once (e.g., in a setup script)
  or restart the app so Mongoose builds indexes.
- Keep passwordHash selectable by default since login needs it; we strip it in toJSON and
  avoid selecting it in read endpoints (`.select("-passwordHash")`).
*/
