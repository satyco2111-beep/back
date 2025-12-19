// models/userModel.js
import mongoose from "mongoose";

const workSchema = new mongoose.Schema(
  {
    swrid: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, },
    sctyid: { type: String, required: true },
    sloctyid: { type: String, required: true },
    ssrvcid: { type: String, required: true },
    status: { type: String, required: true ,default:"OPEN"},
    paymentStatus: { type: String, required: true ,default:"UNPAID"},
    price: { type: String, required: true },
    suid: { type: String, required: true },
    sprovid: { type: String },
  },
  { timestamps: true }
);

const Swork = mongoose.model("Swork", workSchema);
export default Swork;
