import mongoose from "mongoose";

const referralSchema = new mongoose.Schema(
  {
    srefid: { type: String, required: true, unique: true },

    inviterType: { type: String, enum: ["USER", "PROVIDER"], required: true },
    inviterId: { type: String, required: true }, // suid or sprovid

    inviteeType: { type: String, enum: ["USER", "PROVIDER"], required: true },
    inviteeId: { type: String, required: true }, // suid or sprovid
    inviteeEmail: { type: String, required: true },

    // Rewards (credit) tracking
    rewardWorkAcceptedGiven: { type: Boolean, default: false }, // user-referral milestone
    rewardProviderFirstAcceptGiven: { type: Boolean, default: false }, // provider-referral milestone
  },
  { timestamps: true }
);

referralSchema.index({ inviterType: 1, inviterId: 1, createdAt: -1 });
referralSchema.index({ inviteeType: 1, inviteeId: 1 }, { unique: true }); // one referral per account

export default mongoose.model("Sreferral", referralSchema);

