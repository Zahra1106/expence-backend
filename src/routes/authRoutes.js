const express = require("express");
const rateLimit = require("express-rate-limit");
const { register, login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { registerRules, loginRules, handleValidation } = require("../middleware/validators");

const router = express.Router();

// Rate limit: max 30 register/login attempts per 15 minutes from one IP.
// This slows down people who try to guess passwords.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again in a few minutes." },
});

router.post("/register", authLimiter, registerRules, handleValidation, register);
router.post("/login", authLimiter, loginRules, handleValidation, login);
router.get("/me", protect, getMe); // protected: needs a valid token

module.exports = router;
