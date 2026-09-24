const mongoose = require("mongoose");

// On Vercel, this function can be called on every request (cold start), so we
// cache the connection and skip reconnecting once it's already established.
let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  const conn = await mongoose.connect(process.env.MONGO_URI);
  isConnected = true;
  console.log(`MongoDB connected: ${conn.connection.host}`);
}

module.exports = connectDB;