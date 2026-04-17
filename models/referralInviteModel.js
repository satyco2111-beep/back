import mongoose from "mongoose";

const referralInviteSchema = new mongoose.Schema(
  {
    sinviteid: { type: String, required: true, unique: true },

    inviterType: { type: String, enum: ["USER", "PROVIDER"], required: true },
    inviterId: { type: String, required: true }, // suid or sprovid
    inviterEmail: { type: String },

    inviteeEmail: { type: String, required: true },

    // The inviter's referral code the invitee should enter on signup
    referralCode: { type: String, required: true },

    status: { type: String, enum: ["PENDING", "ACCEPTED", "EXPIRED"], default: "PENDING" },
  },
  { timestamps: true }
);

referralInviteSchema.index({ inviterType: 1, inviterId: 1, createdAt: -1 });
referralInviteSchema.index({ inviteeEmail: 1, status: 1 });

export default mongoose.model("SreferralInvite", referralInviteSchema);

