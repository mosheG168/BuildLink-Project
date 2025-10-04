/*
* Basic subcontractor profile schema.
! Validation lives in a separate component (validators/subContractorProfile.js) using Joi.
! Job applications are NOT here — they will live in a JobApplications collection and reference JobPostings.
! On the main feed, show subcontractor displayName + photo + primaryTrade + short blurb.
! Any applications the subcontractor submits can appear in his profile (short, linked to full page).
* Fields chosen to quickly communicate capability, availability, and credibility.
*/

import mongoose from "mongoose";

const { Schema, model } = mongoose;

/* ---------- Embedded Schemas ---------- */

const CertificateSchema = new Schema(
  {
    title: { type: String, required: true, trim: true }, // e.g., "Certified Electrician - Level 3"
    authority: { type: String, trim: true }, // issuing body
    credentialId: { type: String, trim: true }, // license / registration #
    issueDate: { type: Date },
    expiryDate: { type: Date },
    fileUrl: { type: String, trim: true }, // uploaded PDF/image
    authorityUrl: { type: String, trim: true }, // gov/registry link
    verified: { type: Boolean, default: false }, // admin/AI verified
  },
  { _id: false }
);

// Short availability blocks (for quick display in profile cards)
const AvailabilitySlotSchema = new Schema(
  {
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    note: { type: String, trim: true }, // e.g., "Available afternoons only"
  },
  { _id: false }
);

const ContactSchema = new Schema(
  {
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    website: { type: String, trim: true },
    socials: {
      instagram: { type: String, trim: true },
      linkedin: { type: String, trim: true },
      facebook: { type: String, trim: true },
      tiktok: { type: String, trim: true },
    },
  },
  { _id: false }
);

const AddressSchema = new Schema(
  {
    line1: { type: String, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, trim: true },
    postcode: { type: String, trim: true },
    country: { type: String, trim: true, default: "IL" },
    googleMapsUrl: { type: String, trim: true },
  },
  { _id: false }
);

const PortfolioImageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    caption: { type: String, trim: true },
  },
  { _id: false }
);

// Project experience line items (for credibility)
const ExperienceSchema = new Schema(
  {
    projectName: { type: String, trim: true },
    clientName: { type: String, trim: true },
    location: { type: String, trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    description: { type: String, trim: true },
    tradeRole: { type: String, trim: true }, // e.g., "Electrician", "Tiler"
    referenceUrl: { type: String, trim: true }, // optional proof link
    images: [PortfolioImageSchema],
  },
  { _id: false }
);

/* ---------- Main Schema ---------- */

const SubContractorProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      index: true,
      required: true,
    },

    // Core identity
    displayName: { type: String, required: true, trim: true }, // shown in feed/profile card
    profilePhotoUrl: { type: String, trim: true },
    shortBio: { type: String, trim: true, max_length: 400 }, // quick intro for feed card

    // Professional basics
    primaryTrade: { type: String, required: true, trim: true }, // main specialization
    otherTrades: [{ type: String, trim: true }],
    skills: [{ type: String, trim: true }],

    // Work logistics
    yearsExperience: { type: Number, min: 0 },
    coverageAreas: [{ type: String, trim: true }], // cities/regions serviced
    address: AddressSchema,

    // Availability & rates
    availability: [AvailabilitySlotSchema],
    dayRate: { type: Number, min: 0 }, // e.g., NIS per day
    hourRate: { type: Number, min: 0 }, // e.g., NIS per hour
    currency: { type: String, trim: true, default: "ILS" },
    vatRegistered: { type: Boolean, default: false },

    // Languages (communication on site)
    languages: [{ type: String, trim: true }], // e.g., "Hebrew", "English", "Russian"

    // Portfolio & docs
    portfolio: [PortfolioImageSchema],
    documents: [{ type: String, trim: true }], // misc docs (CV, recommendations)

    // Contact
    contact: ContactSchema,

    // Reputation & reviews
    ratingAvg: { type: Number, min: 0, max: 5, default: 0 },
    ratingCount: { type: Number, min: 0, default: 0 },

    // Profile state
    isVerified: { type: Boolean, default: false }, // admin/AI verification
    completeness: { type: Number, min: 0, max: 100, default: 0 },
    isVisible: { type: Boolean, default: true }, // hide from search if needed
  },
  { timestamps: true }
);

/* ---------- Indexes ---------- */
// Text index for search (feed, search bar, etc.)
SubContractorProfileSchema.index({
  displayName: "text",
  primaryTrade: "text",
  skills: "text",
  coverageAreas: "text",
  tools: "text",
});
SubContractorProfileSchema.index({ primaryTrade: 1, ratingAvg: -1 });

export default model("SubContractorProfile", SubContractorProfileSchema);

// TODO: Add pre-save hook to compute 'completeness' based on filled fields
//       (e.g., +photo, +primaryTrade, +address, +certs, +portfolio, +contact, +availability).
// TODO: Create Joi validation in validators/subContractorProfile.js (match shapes above).
// TODO: Create JobApplications model that references both User and JobPostings.
// TODO: In feed, render: photo, displayName, primaryTrade, shortBio, ratingAvg, top 1–2 areas, cheapest rate.
