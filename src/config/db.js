const mongoose = require("mongoose");

// Connects to MongoDB using the connection string from the environment.
async function connectDB() {
  const conn = await mongoose.connect(process.env.MONGO_URI);
  console.log(`MongoDB connected: ${conn.connection.host}`);
}

module.exports = connectDB;
