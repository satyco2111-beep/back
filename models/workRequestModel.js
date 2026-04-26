import mongoose from "mongoose";

const workRequestSchema = new mongoose.Schema(
  {
    srequestid: { type: String, required: true, unique: true },
    swrid: { type: String, required: true }, // Work ID
    suid: { type: String, required: true }, // User ID (who posted the work)
    sprovid: { type: String, required: true }, // Provider ID (who received the request)
    message: { type: String }, // Optional message from user
    status: { 
      type: String, 
      enum: ["PENDING", "ACCEPTED", "REJECTED", "CANCELLED"], 
      default: "PENDING" 
    },
    isSeen: { type: Boolean, default: false }, // Whether provider has seen the request
    requestedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date }, // When provider accepts/rejects
  },
  { timestamps: true }
);

const SworkRequest = mongoose.model("SworkRequest", workRequestSchema);
export default SworkRequest;
