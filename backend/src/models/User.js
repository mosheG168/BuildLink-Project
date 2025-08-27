import mongoose from "mongoose";

const ROLES = ["worker", "subcontractor", "contractor", "admin"];

const nameSub = new mongoose.Schema(
  {
    first: { type: String, required: true, trim: true },
    middle: { type: String, default: "", trim: true },
    last: { type: String, required: true, trim: true },
  },
  { _id: false }
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
    zip: { type: Number, required: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: nameSub, required: true },
    phone: { type: String, required: true, match: /^05\d{8}$/ },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    image: { type: imageSub, default: () => ({}) },
    address: { type: addressSub, required: true },
    isBusiness: { type: Boolean, required: true },
    role: { type: String, enum: ROLES, default: "worker" }, //? maybe set based on isBusiness in the route if we want
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });

export default mongoose.model("User", userSchema);
