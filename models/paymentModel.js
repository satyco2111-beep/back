import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    spayid: { type: String, required: true, unique: true },
    providerId: { type: String, required: true }, // sprovid

    providerEmail: { type: String },

    gateway: { type: String, enum: ["RAZORPAY"], required: true },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String, required: true, unique: true },
    razorpaySignature: { type: String, required: true },

    amountPaid: { type: Number, required: true }, // INR
    creditBonusPercent: { type: Number, required: true }, // 0.05
    creditAdded: { type: Number, required: true }, // amountPaid * (1 + bonus)

    status: { type: String, enum: ["SUCCESS"], required: true },
  },
  { timestamps: true }
);

paymentSchema.index({ providerId: 1, createdAt: -1 });

export default mongoose.model("Spayment", paymentSchema);

