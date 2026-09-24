const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Creates a token that contains the user's id. It expires after 7 days.
function createToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// POST /api/auth/register
async function register(req, res) {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ message: "An account with this email already exists" });
  }

  // The password is hashed by the pre-save hook in the User model
  const user = await User.create({ name, email, password });

  res.status(201).json({ user, token: createToken(user._id) });
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;

  // The password is hidden by default, so we ask for it with select("+password")
  const user = await User.findOne({ email }).select("+password");

  // Same message for "no such user" and "wrong password" so attackers can't tell which one it was
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  res.json({ user, token: createToken(user._id) });
}

// GET /api/auth/me  (protected - req.user is set by the auth middleware)
async function getMe(req, res) {
  res.json({ user: req.user });
}

module.exports = { register, login, getMe };
