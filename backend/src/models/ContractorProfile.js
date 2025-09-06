/*
* Basic contractor profile schema.
! Validation will be dealt with in a separate component (validators/contractorProfile.js) using Joi.
! Job hiring needs will be in a create-job component, not here.
! On the main feed will appear contractor name + photo and job hiring needs (short version).
! The jobs / projects the contractor is hiring for will be in a separate collection (JobPostings) but appear in his profile for reference.
* What fields should we show?
* Look a the pictures attached for visualization of the profile page.
 */

import mongoose from "mongoose";

const { Schema, model } = mongoose;

/* ---------- Embedded Schemas ---------- */

const CertificateSchema = new Schema(
  {
    title: { type: String, required: true, trim: true }, // e.g., "קבלן בתים פרטיים מורשה"
    authority: { type: String, trim: true }, // issuing body
    credentialId: { type: String, trim: true }, // license / registration #
    issueDate: { type: Date },
    expiryDate: { type: Date },
    fileUrl: { type: String, trim: true }, // link to uploaded PDF/image
    authorityUrl: { type: String, trim: true }, // e.g., gov.il registry link
    verified: { type: Boolean, default: false }, // admin-verified or AI-verified badge
  },
  { _id: false }
);

const jobProfileDescriptionSchema = new Schema( //TODO: make better name for this schema..
  //* Every job application the contractor creates will automatically appear in his profile in short version and clickable / link to job page.
  //* e.g { " Looking for a high voltage electrician for a project in Tel-Aviv in 3 days"}
  {
    subContractorNeeded: { type: String, trim: true },
    projectTimeLine: { type: Date, trim: true },
    projectLocation: { type: String, trim: true },
    notes: { type: String, trim: true },
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

/* ---------- Main Schema ---------- */

const ContractorProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      index: true,
      required: true,
    },

    // Core identity
    displayName: { type: String, required: true, trim: true },
    profilePhotoUrl: { type: String, trim: true },

    // Business basics
    companyName: { type: String, trim: true },
    companyNumber: { type: String, trim: true },
    utr: { type: String, trim: true },
    yearsExperience: { type: Number, min: 0 },

    // Trades / skills
    primaryTrade: { type: String, required: true, trim: true },
    otherTrades: [{ type: String, trim: true }],
    skills: [{ type: String, trim: true }],

    // General work coverage
    jobTypes: [{ type: String, trim: true }],
    services: [{ type: String, trim: true }],
    coverageAreas: [{ type: String, trim: true }],
    address: AddressSchema,

    // Compliance
    certificates: [CertificateSchema],

    // Portfolio & docs
    portfolio: [PortfolioImageSchema],
    documents: [{ type: String, trim: true }],

    // Contact
    contact: ContactSchema,

    // Reputation & reviews (from subcontractors and/or Google / Social Media)
    ratingAvg: { type: Number, min: 0, max: 5, default: 0 },
    ratingCount: { type: Number, min: 0, default: 0 },

    // Moderation / completeness
    isVerified: { type: Boolean, default: false },
    completeness: { type: Number, min: 0, max: 100, default: 0 },
  },
  { timestamps: true }
);

/* ---------- Indexes ---------- */
ContractorProfileSchema.index({
  displayName: "text",
  companyName: "text",
  primaryTrade: "text",
  skills: "text",
  services: "text",
  coverageAreas: "text",
});
ContractorProfileSchema.index({ primaryTrade: 1 });

export default model("ContractorProfile", ContractorProfileSchema);
