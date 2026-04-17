import mongoose from "mongoose";

const creditWithdrawalRequestSchema = new mongoose.Schema(
  {
    swrid: { type: String, required: true, unique: true },
    suid: { type: String, required: true, index: true },
    upiId: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("CreditWithdrawalRequest", creditWithdrawalRequestSchema);
