const express = require("express");
const {
  login,
  signup,
  getCurrentUser,
  logout,
  verifyEmail,
  resendVerification,
} = require("../controllers/auth.controller");
const protect = require("../middlewares/auth.middleware");
const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", protect, getCurrentUser);
router.post("/logout", logout);
router.get("/verify-email/:token", verifyEmail);
router.get("/resend-verification", resendVerification);

module.exports = router;
