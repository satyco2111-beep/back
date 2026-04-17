import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    scommentid: { type: String, required: true },
    comment: { type: String, required: true },
    swrid: { type: String, required: true },
    authorId: { type: String, required: true }, // userId or providerId who commented
    authorType: { type: String, enum: ["user", "provider"], required: true }, // who commented
    authorName: { type: String, required: true },
    receiverId: { type: String }, // userId who receives the comment (for tracking comments about a user)
  },
  { timestamps: true }
);

const Scomment = mongoose.model("Scomment", commentSchema);
export default Scomment;
