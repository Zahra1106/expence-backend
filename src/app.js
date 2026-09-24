const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const reportRoutes = require("./routes/reportRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const connectDB = require("./config/db");

const app = express();

// Needed on Render/Heroku etc. so rate limiting sees the real visitor IP, not the proxy's
app.set("trust proxy", 1);

app.use(helmet()); // sets safe HTTP headers

// CLIENT_URL can hold one URL, or several separated by commas
// e.g. "http://localhost:5173,https://your-frontend.vercel.app"
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // requests with no origin (Postman, curl, server-to-server) are allowed
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
); // only our frontend(s) may call the API

app.use(express.json({ limit: "10kb" })); // read JSON request bodies

// On Vercel, server.js (which normally connects first) never actually runs —
// Vercel calls this exported app directly. So we make sure the database is
// connected (or reuse the cached connection) before any route handler runs.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/reports", reportRoutes);

app.use(notFound);
app.use(errorHandler); // must be last

module.exports = app;