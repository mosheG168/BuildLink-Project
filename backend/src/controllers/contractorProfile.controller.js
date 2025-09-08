//* Description: Controller for contractor profile operations
//* Connects the pre-existing user data with the contractor profile creation and update process.

import ContractorProfile from "../models/ContractorProfile.js";
import {
  upsertContractorProfileSchema,
  prefillContractorProfileInput,
} from "../validators/contractorProfile.js";
import User from "../models/User.js";

export const upsertMe = async (req, res) => {
  // Get the freshest user doc (or rely on req.user if it contains full fields)
  const user = await User.findById(req.user._id).lean();

  // 1) Prefill from user registration data
  const prefilled = prefillContractorProfileInput(user, req.body);

  // 2) Validate
  const { value, error } = upsertContractorProfileSchema.validate(prefilled);
  if (error) return res.status(400).json({ error: error.details[0].message });

  // 3) Persist
  value.userId = req.user._id;
  const doc = await ContractorProfile.findOneAndUpdate(
    { userId: req.user._id },
    { $set: value },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.json(doc);
};
