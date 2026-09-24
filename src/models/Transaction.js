const mongoose = require("mongoose");
const { TRANSACTION_TYPES } = require("../config/constants");

const transactionSchema = new mongoose.Schema({
  // Every transaction belongs to one user. The index makes "find all of my transactions" fast.
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  type: { type: String, enum: TRANSACTION_TYPES, required: true },
  amount: {
    type: Number,
    required: true,
    validate: { validator: (value) => value > 0, message: "Amount must be greater than 0" },
  },
  category: { type: String, required: true, trim: true },
  note: { type: String, trim: true, maxlength: 200, default: "" },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

transactionSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Transaction", transactionSchema);
