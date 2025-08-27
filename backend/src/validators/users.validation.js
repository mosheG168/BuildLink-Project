import Joi from "joi";

export const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=(?:.*\d){4,})(?=.*[!@#$%^&*-]).{9,}$/;

export const israeliPhonePattern = /^(?:\+972-?|0)5\d{8}$/; // (supports +9725XXXXXXXX and 05XXXXXXXX).
const nameSchema = Joi.object({
  first: Joi.string().min(2).max(256).required().messages({
    "string.base": "First name must be text",
    "string.min": "First name must be at least 2 characters",
    "string.max": "First name must be at most 256 characters",
    "any.required": "First name is required",
  }),
  middle: Joi.string().allow("").max(256).messages({
    "string.max": "Middle name must be at most 256 characters",
  }),
  last: Joi.string().min(2).max(256).required().messages({
    "string.base": "Last name must be text",
    "string.min": "Last name must be at least 2 characters",
    "string.max": "Last name must be at most 256 characters",
    "any.required": "Last name is required",
  }),
})
  .required()
  .messages({
    "any.required": "Name is required",
  });

const imageSchema = Joi.object({
  url: Joi.string().uri().allow("").messages({
    "string.uri": "Image URL must be a valid URI",
  }),
  alt: Joi.string().allow(""),
}).optional();

const addressSchema = Joi.object({
  state: Joi.string().min(2).max(256).required().messages({
    "string.min": "State must be at least 2 characters",
    "string.max": "State must be at most 256 characters",
    "any.required": "State is required",
  }),
  country: Joi.string().min(2).max(256).required().messages({
    "string.min": "Country must be at least 2 characters",
    "string.max": "Country must be at most 256 characters",
    "any.required": "Country is required",
  }),
  city: Joi.string().min(2).max(256).required().messages({
    "string.min": "City must be at least 2 characters",
    "string.max": "City must be at most 256 characters",
    "any.required": "City is required",
  }),
  street: Joi.string().min(2).max(256).required().messages({
    "string.min": "Street must be at least 2 characters",
    "string.max": "Street must be at most 256 characters",
    "any.required": "Street is required",
  }),
  houseNumber: Joi.number().min(1).max(9999).required().messages({
    "number.base": "House number must be a number",
    "number.min": "House number must be at least 1",
    "number.max": "House number must be at most 9999",
    "any.required": "House number is required",
  }),
  zip: Joi.number().required().messages({
    "number.base": "Zip must be a number",
    "any.required": "Zip is required",
  }),
})
  .required()
  .messages({
    "any.required": "Address is required",
  });

export const registerSchema = Joi.object({
  name: nameSchema,
  phone: Joi.string().pattern(israeliPhonePattern).required().messages({
    "string.pattern.base":
      "Phone must be a valid Israeli mobile number (e.g., 05XXXXXXXX)",
    "any.required": "Phone is required",
  }),
  email: Joi.string()
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
      "Password must be ≥9 chars and include uppercase, lowercase, number, and a special character (!@#$%^&*-) ",
    "any.required": "Password is required",
  }),
  image: imageSchema,
  address: addressSchema,
  isBusiness: Joi.boolean().required().messages({
    "boolean.base": "isBusiness must be true or false",
    "any.required": "isBusiness is required",
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string()
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

// Helper: format Joi details into { "path.to.field": "message" }
const formatJoiErrors = (details) =>
  details.reduce((acc, d) => {
    const path = d.path.join(".");
    acc[path] = d.message.replace(/"/g, "");
    return acc;
  }, {});

// Middleware: return ALL errors at once, strip unknown fields, and coerce numbers
export const validateUser = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false, // collect all errors
    stripUnknown: true, // drop unexpected fields
    convert: true, // coerce "123" -> 123 for numbers like zip
  });

  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      errors: formatJoiErrors(error.details),
    });
  }

  req.body = value;
  next();
};

//? Do we want more fields in the main register page or in a create a profile page later on?
