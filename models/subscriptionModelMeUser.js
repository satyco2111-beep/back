import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    ssubid: { type: String, required: true, unique: true },
    suid: { type: String, required: true },
    planId: { type: String, required: true },
    planName: { type: String, required: true },
    status: {
      type: String,
      enum: ["ACTIVE", "CANCELLED", "PAST_DUE", "SUSPENDED", "EXPIRED"],
      default: "ACTIVE",
    },
    billingCycle: { type: String, default: "MONTHLY" },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    nextBillingDate: { type: Date },
    totalCyclesBilled: { type: Number, default: 0 },
    cancelAtCycleEnd: { type: Boolean, default: false },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

// Index for efficient queries
subscriptionSchema.index({ suid: 1, status: 1 });
const SsubscriptionMeUser = mongoose.model("SsubscriptionMeUser", subscriptionSchema);
export default SsubscriptionMeUser;