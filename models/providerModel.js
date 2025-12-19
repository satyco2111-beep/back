// // models/userModel.js
// import mongoose from "mongoose";

// const providerSchema = new mongoose.Schema(
//   {
//     sprovid: { type: String, required: true },
//     name: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//   },
//   { timestamps: true }
// );

// const Sprovider = mongoose.model("Sprovider", providerSchema);
// export default Sprovider;


////////////////////////////


import mongoose from "mongoose";
import bcrypt from "bcrypt";

const providerSchema = new mongoose.Schema(
  {
    sprovid: String,
    name: String,
    email: { type: String, unique: true },
    mobile: String,
    password: String,
    roll: { type: String, default: "2" },
    payment_due: {
      type: Boolean,
      default: false,
    },
    amount_due: String,
    accesstoken: String,
    sessionAccesstoken: String,
    emailVerifyAccesstoken: String,
    emailVerify: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
// Hash password before saving
providerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password
providerSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("Sprovider", providerSchema);
