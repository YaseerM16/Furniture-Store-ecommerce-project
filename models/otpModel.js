const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: (value) => {
        // Validate email format
        return /\S+@\S+\.\S+/.test(value);
      },
      message: "Invalid email format",
    },
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 5, // The document will be automatically deleted after 5 minutes of its creation time
  },
});

module.exports = mongoose.model("Otp", otpSchema);
