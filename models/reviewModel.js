import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    sreviewid: { type: String, required: true },
    review: { type: String, required: true },
    swrid: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true }, // 1 to 5 stars
    authorId: { type: String, required: true }, // userId or providerId who reviewed
    authorType: { type: String, enum: ["user", "provider"], required: true }, // who reviewed
    authorName: { type: String, required: true },
    receiverId: { type: String, required: true }, // who is being reviewed
  },
  { timestamps: true }
);

const Sreview = mongoose.model("Sreview", reviewSchema);
export default Sreview;
