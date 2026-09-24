const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, "Name is required"], trim: true },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true, // creates a unique index, so two users can't share an email
    lowercase: true,
    trim: true,
  },
  // select: false means the password is NOT loaded from the database unless we ask for it
  password: { type: String, required: true, select: false },
  createdAt: { type: Date, default: Date.now },
});

// Hash the password before saving, but only when it was set or changed
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Used at login: compares the plain password with the stored hash
userSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

// Make sure the password (and __v) are never included when a user is sent as JSON
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
