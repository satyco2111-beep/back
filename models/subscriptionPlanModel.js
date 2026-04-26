import mongoose from "mongoose";

const subscriptionPlanSchema = new mongoose.Schema(
  {
    planId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    amount: { type: Number, required: true }, // in INR
    currency: { type: String, default: "INR" },
    billingPeriod: { type: String, default: "MONTHLY" },
    periodDays: { type: Number, default: 30 },
    features: { type: [String] },
    maxWorks: { type: Number, default: null }, // null = unlimited
    maxWorkRequests: { type: Number, default: null },
    isActive: { type: Boolean, default: true },
    razorpayPlanId: { type: String },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const SsubscriptionPlan = mongoose.model("SsubscriptionPlan", subscriptionPlanSchema);
export default SsubscriptionPlan;