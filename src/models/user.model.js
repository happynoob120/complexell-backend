const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    isBanned: {
      type: Boolean,
      default: false,
    },

    bannedAt: Date,

    bannedReason: String,

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    verificationToken: String,

    verificationTokenExpires: Date,
  },

  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

module.exports = User;
