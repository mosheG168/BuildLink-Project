/*
* Contractor Profile Joi validation
! This validator PREFILLS from user registration data (name, phone, email, image, address) before validating.
! Hiring/matching is handled elsewhere (create-job component).
*/

import Joi from "joi";

import { israeliPhonePattern } from "../validators/users.validation";

/* ---------- Helpers ---------- */
const uri = Joi.string().uri({ scheme: ["http", "https"] });
const isoDate = Joi.date().iso();

/* ---------- Embedded Schemas (STRICT) ---------- */

const contact = Joi.object({
  phone: Joi.string().trim().pattern(israeliPhonePattern).required().messages({
    "string.pattern.base":
      "Phone must be a valid Israeli mobile number (e.g., 05XXXXXXXX or +9725XXXXXXXX)",
    "any.required": "Phone is required",
  }),
  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .min(5)
    .required()
    .messages({
      "string.email": "Email must be a valid email address",
      "string.min": "Email must be at least 5 characters",
      "any.required": "Email is required",
    }),
  website: uri.allow(""),
  socials: Joi.object({
    instagram: uri.allow(""),
    linkedin: uri.allow(""),
    facebook: uri.allow(""),
    tiktok: uri.allow(""),
  }).default({}),
}).required();

const address = Joi.object({
  state: Joi.string().trim().min(2).max(256).required(),
  country: Joi.string().trim().min(2).max(256).required(),
  city: Joi.string().trim().min(2).max(256).required(),
  street: Joi.string().trim().min(2).max(256).required(),
  // Accept number or numeric-string; convert:true will coerce where possible.
  houseNumber: Joi.alternatives()
    .try(Joi.number().min(1).max(9999), Joi.string().pattern(/^\d{1,4}$/))
    .required()
    .messages({
      "number.base": "House number must be a number",
      "number.min": "House number must be at least 1",
      "number.max": "House number must be at most 9999",
      "string.pattern.base": "House number must be 1–4 digits",
      "any.required": "House number is required",
    }),
  // Israel ZIPs are 7 digits; accept 5–7 to be forgiving.
  zip: Joi.alternatives()
    .try(Joi.number(), Joi.string().pattern(/^\d{5,7}$/))
    .required()
    .messages({
      "number.base": "Zip must be a number",
      "string.pattern.base": "Zip must be 5–7 digits",
      "any.required": "Zip is required",
    }),
  googleMapsUrl: uri.allow(""),
}).required();

const certificate = Joi.object({
  title: Joi.string().trim().min(2).max(120).required(), // e.g., "קבלן בתים פרטיים מורשה"
  authority: Joi.string().trim().max(120).allow(""),
  credentialId: Joi.string().trim().max(60).allow(""),
  issueDate: isoDate.allow(null),
  expiryDate: isoDate.allow(null),
  fileUrl: uri.allow(""),
  authorityUrl: uri.allow(""),
  verified: Joi.boolean().default(false),
}).custom((val, helpers) => {
  if (val.issueDate && val.expiryDate && val.expiryDate < val.issueDate) {
    return helpers.error("any.invalid", {
      message: "expiryDate must be after issueDate",
    });
  }
  return val;
}, "certificate temporal check");

const portfolioItem = Joi.object({
  url: uri.required(),
  caption: Joi.string().trim().max(120).allow(""),
});

/* ---------- Main Upsert Schema ---------- */

export const upsertContractorProfileSchema = Joi.object({
  // server-managed fields
  userId: Joi.forbidden(),
  ratingAvg: Joi.forbidden(),
  ratingCount: Joi.forbidden(),
  isVerified: Joi.forbidden(),
  completeness: Joi.forbidden(),
  createdAt: Joi.forbidden(),
  updatedAt: Joi.forbidden(),
  __v: Joi.forbidden(),

  // identity
  displayName: Joi.string().trim().min(2).max(80).required(),
  profilePhotoUrl: uri.allow(""),

  // business basics
  companyName: Joi.string().trim().max(120).allow(""),
  companyNumber: Joi.string().trim().max(40).allow(""),
  utr: Joi.string().trim().max(20).allow(""),
  yearsExperience: Joi.number().integer().min(0).max(60).allow(null),

  // trade/skills
  primaryTrade: Joi.string().trim().min(2).max(60).required(),
  otherTrades: Joi.array()
    .items(Joi.string().trim().min(2).max(60))
    .max(10)
    .default([]),
  skills: Joi.array()
    .items(Joi.string().trim().min(2).max(60))
    .max(30)
    .default([]),

  // coverage
  jobTypes: Joi.array()
    .items(Joi.string().trim().min(2).max(60))
    .max(10)
    .default([]),
  services: Joi.array()
    .items(Joi.string().trim().min(2).max(60))
    .max(30)
    .default([]),
  coverageAreas: Joi.array()
    .items(Joi.string().trim().min(2).max(80))
    .max(30)
    .default([]),
  address: address,

  // compliance
  certificates: Joi.array().items(certificate).max(30).default([]),

  // portfolio & docs
  portfolio: Joi.array().items(portfolioItem).max(30).default([]),
  documents: Joi.array().items(uri).max(30).default([]),

  // contact
  contact: contact,
}).options({
  abortEarly: true,
  stripUnknown: true,
  convert: true,
});

/* ---------- Patch Schema (everything optional) ---------- */
export const patchContractorProfileSchema = upsertContractorProfileSchema.fork(
  Object.keys(upsertContractorProfileSchema.describe().keys),
  (s) => s.optional()
);

/* ---------- Convenience Validators ---------- */
export const addCertificateSchema = certificate;
export const addPortfolioItemSchema = portfolioItem;
export const updateContactSchema = contact;
export const updateAddressSchema = address;

/* =================================================================== */
/* ========================== PREFILL LOGIC =========================== */
/* =================================================================== */

/**
 * Pulls defaults from a User document (as captured at register)
 * and merges into the incoming profile payload if fields are missing.
 * - Does not overwrite fields already provided in `payload`.
 * - Safe to run before Joi validation.
 *
 * Expected User shape (examples):
 *  user.name = { first, middle?, last }
 *  user.phone, user.email
 *  user.image = { url, alt? }
 *  user.address = { state, country, city, street, houseNumber, zip }
 */
export function prefillContractorProfileInput(user, payload = {}) {
  if (!user) return payload;

  const out = { ...payload };

  // Display name: fallback to "First Last" if not provided
  if (!out.displayName && user?.name?.first && user?.name?.last) {
    out.displayName = `${user.name.first} ${user.name.last}`.trim();
  }

  // Profile image
  if (!out.profilePhotoUrl && user?.image?.url) {
    out.profilePhotoUrl = user.image.url;
  }

  // Contact
  out.contact = out.contact || {};
  if (!out.contact.phone && user?.phone) out.contact.phone = user.phone;
  if (!out.contact.email && user?.email) out.contact.email = user.email;

  // Address
  if (!out.address) out.address = {};
  const ua = user?.address || {};
  const pa = out.address;
  out.address = {
    state: pa.state ?? ua.state,
    country: pa.country ?? ua.country,
    city: pa.city ?? ua.city,
    street: pa.street ?? ua.street,
    houseNumber: pa.houseNumber ?? ua.houseNumber,
    zip: pa.zip ?? ua.zip,
    googleMapsUrl: pa.googleMapsUrl, // only from payload if provided
  };

  return out;
}
