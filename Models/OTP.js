import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
  },
  OTP: {
    type: String,
  },
  token: {
    type: String,
  },
});

const Otp = mongoose.model("otp", otpSchema);
export { Otp };
