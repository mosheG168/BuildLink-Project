/*
* Subcontractor Profile validation
! This validator prefills from user registration data (name, phone, email, image, address) before validating.
! Feed card should show displayName + photo + primaryTrade + shortBio (optional).
*/

import Joi from "joi";
import { israeliPhonePattern } from "./users.validation.js";

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
  title: Joi.string().trim().min(2).max(120).required(), // e.g., "חשמלאי מוסמך - מתח גבוה"
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

const availabilitySlot = Joi.object({
  from: isoDate.required(),
  to: isoDate.required(),
  note: Joi.string().trim().max(200).allow(""),
}).custom((val, helpers) => {
  //! Date logic function to ensure 'to' is after 'from'...
  if (val.from && val.to && new Date(val.to) <= new Date(val.from)) {
    return helpers.error("any.invalid", {
      message: "`to` must be after `from`",
    });
  }
  return val;
}, "availability temporal check");

const experienceItem = Joi.object({
  projectName: Joi.string().trim().max(120).allow(""),
  clientName: Joi.string().trim().max(120).allow(""),
  location: Joi.string().trim().max(120).allow(""),
  startDate: isoDate.allow(null),
  endDate: isoDate.allow(null),
  description: Joi.string().trim().max(1000).allow(""),
  tradeRole: Joi.string().trim().max(60).allow(""),
  referenceUrl: uri.allow(""),
  images: Joi.array().items(portfolioItem).max(20).default([]),
}).custom((val, helpers) => {
  if (val.startDate && val.endDate && val.endDate < val.startDate) {
    return helpers.error("any.invalid", {
      message: "end-date must be after start-date",
    });
  }
  return val;
}, "experience temporal check");

/* ---------- Main Schema ---------- */

export const upsertSubContractorProfileSchema = Joi.object({
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
  shortBio: Joi.string().trim().max(400).allow(""),

  // professional basics
  primaryTrade: Joi.string().trim().min(2).max(60).required(),
  otherTrades: Joi.array()
    .items(Joi.string().trim().min(2).max(60))
    .max(10)
    .default([]),
  skills: Joi.array()
    .items(Joi.string().trim().min(2).max(60))
    .max(30)
    .default([]),

  // logistics
  yearsExperience: Joi.number().integer().min(0).max(60).allow(null),
  coverageAreas: Joi.array()
    .items(Joi.string().trim().min(2).max(80))
    .max(30)
    .default([]),
  address: address,

  // availability & rates
  availability: Joi.array().items(availabilitySlot).max(60).default([]),
  dayRate: Joi.number().min(0).allow(null),
  hourRate: Joi.number().min(0).allow(null),
  currency: Joi.string().trim().max(8).default("ILS"),
  vatRegistered: Joi.boolean().default(false),

  // compliance / safety
  certificates: Joi.array().items(certificate).max(30).default([]),
  insurance: Joi.object({
    hasWorkInsurance: Joi.boolean().default(false),
    policyNumber: Joi.string().trim().max(60).allow(""),
    provider: Joi.string().trim().max(120).allow(""),
    expiryDate: isoDate.allow(null),
    fileUrl: uri.allow(""),
  }).default({}),

  // equipment
  tools: Joi.array()
    .items(Joi.string().trim().min(2).max(60))
    .max(50)
    .default([]),
  transport: Joi.string().trim().max(30).allow(""), // e.g., "Van", "Truck", "Car"
  ownsPPE: Joi.boolean().default(true),

  // languages
  languages: Joi.array()
    .items(Joi.string().trim().min(2).max(40))
    .max(10)
    .default([]),

  // portfolio & docs
  portfolio: Joi.array().items(portfolioItem).max(50).default([]),
  documents: Joi.array().items(uri).max(50).default([]),

  // contact
  contact: contact,

  // visibility (optional toggle)
  isVisible: Joi.boolean().default(true),
}).options({
  abortEarly: true,
  stripUnknown: true,
  convert: true,
});

/* ---------- Patch Schema (everything optional) ---------- */
export const patchSubContractorProfileSchema =
  upsertSubContractorProfileSchema.fork(
    Object.keys(upsertSubContractorProfileSchema.describe().keys),
    (s) => s.optional()
  );

/* ---------- Convenience Validators ---------- */
export const addCertificateSchema = certificate;
export const addPortfolioItemSchema = portfolioItem;
export const addAvailabilitySlotSchema = availabilitySlot;
export const addExperienceItemSchema = experienceItem;
export const updateContactSchema = contact;
export const updateAddressSchema = address;

/* =================================================================== */
/* ========================== PREFILL LOGIC =========================== */
/* =================================================================== */

/**
 * Pull defaults from a User document (captured at register)
 * and merge into the incoming profile payload if fields are missing.
 * - Does not overwrite fields already provided in `payload`.
 * - Safe to run before Joi validation.
 *
 * Expected User shape:
 *  user.name = { first, middle?, last }
 *  user.phone, user.email
 *  user.image = { url, alt? }
 *  user.address = { state, country, city, street, houseNumber, zip }
 */
export function prefillSubContractorProfileInput(user, payload = {}) {
  if (!user) return payload;

  const out = { ...payload };

  // Display name fallback: "First Last"
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
    googleMapsUrl: pa.googleMapsUrl, // payload-only
  };

  return out;
}
