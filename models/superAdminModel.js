import mongoose from "mongoose";
import bcrypt from "bcrypt";

const superAdminSchema = new mongoose.Schema(
  {
    sadmid: { type: String, required: true, unique: true },
    name: { type: String, default: "Super Admin" },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    accesstoken: { type: String, default: "" },
  },
  { timestamps: true }
);

superAdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

superAdminSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("SsuperAdmin", superAdminSchema);

