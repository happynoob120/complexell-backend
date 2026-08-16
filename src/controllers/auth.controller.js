const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { validationResult } = require("express-validator");

const generateToken = require("../utils/generateToken");
const sendVerificationEmail = require("../utils/sendVerificationMail");
const isProduction = process.env.NODE_ENV === "production";

const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier.toLowerCase() }],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username/email or password",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email first.",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid username/email or password",
      });
    }

    const token = generateToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "None" : "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const signup = async (req, res) => {
  try {
    const { username, email, password, role, isVerified } = req.body;

    const requestedRole = typeof role === "string" ? role.toLowerCase() : "user";
    const safeRole = ["user", "admin"].includes(requestedRole) ? requestedRole : "user";
    const requestedVerified = typeof isVerified === "boolean" ? isVerified : false;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({
      $or: [{ username }, { email: normalizedEmail }],
    });

    if (existingUser) {
      // VERIFIED ACCOUNT -> Reject
      if (existingUser.isVerified) {
        if (existingUser.email === normalizedEmail) {
          return res.status(409).json({
            success: false,
            message: "Email already exists",
          });
        }

        return res.status(409).json({
          success: false,
          message: "Username already exists",
        });
      }

      // UNVERIFIED ACCOUNT WITH SAME EMAIL -> Resend verification
      if (existingUser.email === normalizedEmail) {
        existingUser.username = username;
        existingUser.password = await bcrypt.hash(password, 10);
        existingUser.role = safeRole;
        existingUser.isVerified = requestedVerified || existingUser.isVerified;

        const verificationToken = crypto.randomBytes(32).toString("hex");

        existingUser.verificationToken = verificationToken;
        existingUser.verificationTokenExpires = Date.now() + 60 * 60 * 1000;

        await existingUser.save();

        try {
          await sendVerificationEmail(existingUser.email, verificationToken);
        } catch (mailError) {
          console.error("Email sending failed:", mailError);

          return res.status(500).json({
            success: false,
            message: "Failed to send verification email. Please try again.",
          });
        }

        return res.status(200).json({
          success: true,
          message:
            "Your account already exists but isn't verified. We've sent you a new verification email.",
        });
      }

      // USERNAME TAKEN BY AN UNVERIFIED ACCOUNT
      return res.status(409).json({
        success: false,
        message: "Username is already reserved by another unverified account.",
      });
    }

    // Create new account
    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = await User.create({
      username,
      email: normalizedEmail,
      password: hashedPassword,
      role: safeRole,
      isVerified: requestedVerified,
      verificationToken,
      verificationTokenExpires: Date.now() + 60 * 60 * 1000,
    });

    try {
      await sendVerificationEmail(user.email, verificationToken);
    } catch (mailError) {
      console.error("Email sending failed:", mailError);

      await User.findByIdAndDelete(user._id);

      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please try again.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Verification email sent. Please check your inbox.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");

    user.verificationToken = verificationToken;
    user.verificationTokenExpires = Date.now() + 60 * 60 * 1000;

    await user.save();

    await sendVerificationEmail(user.email, verificationToken);

    return res.status(200).json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "None" : "Lax",
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      verificationToken: token,
    });

    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL}/verification-failed`);
    }

    if (
      !user.verificationTokenExpires ||
      user.verificationTokenExpires < Date.now()
    ) {
      return res.redirect(`${process.env.CLIENT_URL}/verification-expired`);
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;

    await user.save();

    const authToken = generateToken(user);

    res.cookie("token", authToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "None" : "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.redirect(`${process.env.CLIENT_URL}/verification-success`);
  } catch (error) {
    console.error(error);

    return res.redirect(`${process.env.CLIENT_URL}/verification-failed`);
  }
};

module.exports = {
  login,
  signup,
  getCurrentUser,
  logout,
  verifyEmail,
  resendVerification,
};
