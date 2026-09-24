const jwt = require("jsonwebtoken");
const User = require("../models/User");

// AUTH MIDDLEWARE
// Put this before any route that needs a logged-in user.
// The client sends:  Authorization: Bearer <token>
// If the token is valid we load the user and attach it to req.user,
// so controllers can use req.user._id to only touch that user's data.
async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized. Please log in." });
    }

    const token = header.split(" ")[1];

    // Throws an error if the token is fake, expired or signed with a different secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User no longer exists. Please log in again." });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired or invalid. Please log in again." });
    }
    next(error); // any other error (e.g. database down) goes to the global error handler
  }
}

module.exports = { protect };
