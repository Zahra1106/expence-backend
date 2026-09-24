const Transaction = require("../models/Transaction");

// Escape characters that have a special meaning in regular expressions,
// so a search like "a+b" is treated as plain text.
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Take only the fields a user is allowed to set (so nobody can change "user" through the body)
function pickTransactionFields(body) {
  const fields = {
    type: body.type,
    amount: body.amount,
    category: body.category,
    note: body.note ?? "",
    date: body.date,
  };
  // Remove undefined values (e.g. a missing date keeps the old / default date)
  Object.keys(fields).forEach((key) => fields[key] === undefined && delete fields[key]);
  return fields;
}

// GET /api/transactions?page=&limit=&type=&category=&from=&to=&search=
async function getTransactions(req, res) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const { type, category, from, to, search } = req.query;

  // SECURITY: the filter always starts with the logged-in user's id
  const filter = { user: req.user._id };

  if (type) filter.type = type;
  if (category) filter.category = category;

  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) {
      // include the whole "to" day
      const end = new Date(to);
      end.setUTCHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }

  if (search && search.trim()) {
    filter.note = { $regex: escapeRegex(search.trim()), $options: "i" }; // case-insensitive
  }

  const [items, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ date: -1, createdAt: -1 }) // newest first
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Transaction.countDocuments(filter),
  ]);

  res.json({ items, total, page, pages: Math.ceil(total / limit) || 1 });
}

// POST /api/transactions
async function createTransaction(req, res) {
  const transaction = await Transaction.create({
    ...pickTransactionFields(req.body),
    user: req.user._id, // always the logged-in user, never taken from the request body
  });

  res.status(201).json(transaction);
}

// PUT /api/transactions/:id
async function updateTransaction(req, res) {
  // Matching on BOTH _id and user means you can only update your own transactions.
  // Someone else's id simply returns "not found".
  const transaction = await Transaction.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    pickTransactionFields(req.body),
    { new: true, runValidators: true }
  );

  if (!transaction) {
    return res.status(404).json({ message: "Transaction not found" });
  }

  res.json(transaction);
}

// DELETE /api/transactions/:id
async function deleteTransaction(req, res) {
  const transaction = await Transaction.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id, // scoped to the logged-in user
  });

  if (!transaction) {
    return res.status(404).json({ message: "Transaction not found" });
  }

  res.json({ message: "Transaction deleted" });
}

module.exports = { getTransactions, createTransaction, updateTransaction, deleteTransaction };
