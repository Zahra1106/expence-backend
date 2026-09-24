require("dotenv").config(); // loads server/.env into process.env

const app = require("./app");
const connectDB = require("./config/db");

// Stop early with a clear message if something important is missing
const required = ["MONGO_URI", "JWT_SECRET", "CLIENT_URL"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`Missing environment variables: ${missing.join(", ")}. Copy .env.example to .env and fill it in.`);
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.error("Could not connect to MongoDB:", error.message);
    process.exit(1);
  });
