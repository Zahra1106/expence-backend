const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const reportRoutes = require("./routes/reportRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

// Needed on Render/Heroku etc. so rate limiting sees the real visitor IP, not the proxy's
app.set("trust proxy", 1);

app.use(helmet()); // sets safe HTTP headers
app.use(cors({ origin: process.env.CLIENT_URL })); // only our frontend may call the API
app.use(express.json({ limit: "10kb" })); // read JSON request bodies

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/reports", reportRoutes);

app.use(notFound);
app.use(errorHandler); // must be last

module.exports = app;
