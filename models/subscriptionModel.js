import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    ssubid: { type: String, required: true, unique: true },
    sprovid: { type: String, required: true },
    planId: { type: String, required: true },
    planName: { type: String, required: true },
    razorpaySubscriptionId: { type: String },
    razorpayCustomerId: { type: String },
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
    razorpayPlanId: { type: String },
    totalCyclesBilled: { type: Number, default: 0 },
    cancelAtCycleEnd: { type: Boolean, default: false },
    cancelledAt: { type: Date },
    webhookEvents: [
      {
        event: String,
        receivedAt: { type: Date, default: Date.now },
        processed: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

// Index for efficient queries
subscriptionSchema.index({ sprovid: 1, status: 1 });
subscriptionSchema.index({ razorpaySubscriptionId: 1 });

const Ssubscription = mongoose.model("Ssubscription ", subscriptionSchema);
export default Ssubscription;