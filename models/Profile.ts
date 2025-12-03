import mongoose, { Schema, models } from "mongoose";

const ProfileSchema = new Schema(
  {
    salaryDay: { type: Number, required: true, default: 1 },
    rentDay: { type: Number, required: true, default: 1 },
    currency: { type: String, required: true, default: "INR" }, // legacy; use displayCurrency
    baseCurrency: { type: String, required: true, default: "INR" },
    displayCurrency: { type: String, required: true, default: "INR" },
    fxRate: { type: Number, required: true, default: 1 }, // 1 baseCurrency = fxRate displayCurrency
  },
  { timestamps: true }
);

const Profile = models.Profile || mongoose.model("Profile", ProfileSchema);

export default Profile;
