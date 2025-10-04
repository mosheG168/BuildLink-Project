// Page purpose: Centralizes all Joi schemas + a generic middleware (validateUser)
// to enforce input shape for auth and user routes. Strips unknowns and collects
// ALL validation errors for better client UX.

import Joi from "joi";

/** Password policy
 * ≥ 9 chars, ≥ 1 lowercase, ≥ 1 uppercase, ≥ 1 digit, ≥ 1 special.
 * Tip: keep policy mirrored in frontend hints.
 */
export const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*\-]).{9,}$/;

/** Israeli mobile formats allowed:
 * 05XXXXXXXX or +9725XXXXXXXX (spaces/dashes optional)
 */
export const israeliPhonePattern = /^(?:\+972|0)5[0-9](?:[- ]?\d){7}$/;

// Reuse these where needed (keeps roles consistent across app)
export const ROLES = ["subcontractor", "contractor", "admin"];

const nameSchema = Joi.object({
  first: Joi.string().trim().min(2).max(256).required().messages({
    "string.base": "First name must be text",
    "string.min": "First name must be at least 2 characters",
    "string.max": "First name must be at most 256 characters",
    "any.required": "First name is required",
  }),
  middle: Joi.string().trim().allow("").max(256).messages({
    "string.max": "Middle name must be at most 256 characters",
  }),
  last: Joi.string().trim().min(2).max(256).required().messages({
    "string.base": "Last name must be text",
    "string.min": "Last name must be at least 2 characters",
    "string.max": "Last name must be at most 256 characters",
    "any.required": "Last name is required",
  }),
})
  .required()
  .messages({ "any.required": "Name is required" });

const imageSchema = Joi.object({
  url: Joi.string()
    .uri({ scheme: ["http", "https"] })
    .allow("")
    .messages({
      "string.uri": "Image URL must be a valid http(s) URI",
    }),
  alt: Joi.string().allow("").max(256),
}).optional();

const addressSchema = Joi.object({
  state: Joi.string().trim().min(2).max(256).required().messages({
    "string.min": "State must be at least 2 characters",
    "string.max": "State must be at most 256 characters",
    "any.required": "State is required",
  }),
  country: Joi.string().trim().min(2).max(256).required().messages({
    "string.min": "Country must be at least 2 characters",
    "string.max": "Country must be at most 256 characters",
    "any.required": "Country is required",
  }),
  city: Joi.string().trim().min(2).max(256).required().messages({
    "string.min": "City must be at least 2 characters",
    "string.max": "City must be at most 256 characters",
    "any.required": "City is required",
  }),
  street: Joi.string().trim().min(2).max(256).required().messages({
    "string.min": "Street must be at least 2 characters",
    "string.max": "Street must be at most 256 characters",
    "any.required": "Street is required",
  }),
  // Allow numeric or numeric-string; middleware convert:true will coerce where possible.
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
  // Israel ZIPs are 7 digits.
  zip: Joi.alternatives()
    .try(Joi.number(), Joi.string().pattern(/^\d{5,7}$/))
    .required()
    .messages({
      "number.base": "Zip must be a number",
      "string.pattern.base": "Zip must be 5–7 digits",
      "any.required": "Zip is required",
    }),
})
  .required()
  .messages({ "any.required": "Address is required" });

/** REGISTER: server requires all profile fields upfront (your call UX-wise). */
export const registerSchema = Joi.object({
  name: nameSchema,
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
  password: Joi.string().pattern(passwordPattern).required().messages({
    "string.pattern.base":
      "Password must be ≥9 chars and include uppercase, lowercase, number, and a special character (!@#$%^&*-).",
    "any.required": "Password is required",
  }),
  image: imageSchema,
  address: addressSchema,
  isBusiness: Joi.boolean().required().messages({
    "boolean.base": "isBusiness must be true or false",
    "any.required": "isBusiness is required",
  }),
});

/** LOGIN: minimal shape; email is normalized (trim+lowercase). */
export const loginSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.email": "Email must be a valid email address",
      "any.required": "Email is required",
    }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

/** UPDATE (PATCH /:id): all optional; same rules; at least one field must be present. */
export const updateSchema = Joi.object({
  name: nameSchema
    .fork(["first", "middle", "last"], (s) => s.optional())
    .optional(),
  phone: Joi.string().trim().pattern(israeliPhonePattern).messages({
    "string.pattern.base":
      "Phone must be a valid Israeli mobile number (e.g., 05XXXXXXXX or +9725XXXXXXXX)",
  }),
  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .min(5)
    .messages({
      "string.email": "Email must be a valid email address",
      "string.min": "Email must be at least 5 characters",
    }),
  // password NOT allowed here; use changePasswordSchema instead
  image: imageSchema,
  address: addressSchema
    .fork(["state", "country", "city", "street", "houseNumber", "zip"], (s) =>
      s.optional()
    )
    .optional(),
  isBusiness: Joi.boolean(),
  // FIX: include "subcontractor" to match the model's ROLES
  role: Joi.string().valid(...ROLES),
}).min(1);

/** CHANGE PASSWORD: separate endpoint for security clarity. */
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().pattern(passwordPattern).required().messages({
    "string.pattern.base":
      "New password must be ≥9 chars and include uppercase, lowercase, number, and a special character (!@#$%^&*-).",
  }),
});

// ---------- helpers ----------

// Converts Joi details[] → { "path.to.field": "message" } for easy client display.
const formatJoiErrors = (details) =>
  details.reduce((acc, d) => {
    const path = d.path.join(".");
    acc[path] = d.message.replace(/"/g, "");
    return acc;
  }, {});

// Generic middleware: strips unknowns, converts numbers, returns ALL errors at once.
export const validateUser = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false, // collect all errors
    stripUnknown: true, // drop unexpected fields
    convert: true, // coerce "123" -> 123 for number fields
  });

  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      errors: formatJoiErrors(error.details),
    });
  }

  req.body = value; // normalized payload continues to controller/route
  next();
};

//? Consider moving heavy fields (address, image) to a post-register "Complete Profile" step for a lighter signup UX.

//? Why is login and register schema here as well?????
