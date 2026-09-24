const Transaction = require("../models/Transaction");

// Round to 2 decimals so sums like 0.1 + 0.2 don't show up as 0.30000000000000004
const round = (number) => Math.round(number * 100) / 100;

const pad = (number) => String(number).padStart(2, "0");

// "2026-09" for the current month (UTC)
function currentMonth() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}`;
}

// Turns "2026-09" into { start: 1 Sep 2026, end: 1 Oct 2026 } (end is exclusive)
function monthRange(month) {
  const [year, monthNumber] = (month || currentMonth()).split("-").map(Number);
  return {
    start: new Date(Date.UTC(year, monthNumber - 1, 1)),
    end: new Date(Date.UTC(year, monthNumber, 1)),
  };
}

// NOTE about the aggregation queries below:
// Inside aggregate(), Mongoose does NOT convert strings to ObjectIds like it does in find().
// req.user._id is already an ObjectId, so it is safe to use in $match.
// Every pipeline starts with $match on the user, so users only ever aggregate their own data.

// GET /api/reports/summary?month=YYYY-MM
async function getSummary(req, res) {
  const { start, end } = monthRange(req.query.month);

  // Group the month's transactions by type and add up the amounts
  const rows = await Transaction.aggregate([
    { $match: { user: req.user._id, date: { $gte: start, $lt: end } } },
    { $group: { _id: "$type", total: { $sum: "$amount" } } },
  ]);

  // rows looks like: [{ _id: "income", total: 5000 }, { _id: "expense", total: 1200 }]
  const totalIncome = rows.find((row) => row._id === "income")?.total || 0;
  const totalExpense = rows.find((row) => row._id === "expense")?.total || 0;

  res.json({
    totalIncome: round(totalIncome),
    totalExpense: round(totalExpense),
    balance: round(totalIncome - totalExpense),
  });
}

// GET /api/reports/by-category?month=YYYY-MM
// Expense total for each category, biggest first
async function getByCategory(req, res) {
  const { start, end } = monthRange(req.query.month);

  const rows = await Transaction.aggregate([
    { $match: { user: req.user._id, type: "expense", date: { $gte: start, $lt: end } } },
    { $group: { _id: "$category", total: { $sum: "$amount" } } }, // one row per category
    { $sort: { total: -1 } }, // biggest category first
  ]);

  // After $group the category name is stored in _id, so we rename it for the client
  res.json(rows.map((row) => ({ category: row._id, total: round(row.total) })));
}

// GET /api/reports/monthly?months=6
// Income and expense totals for each of the last N months (including this month)
async function getMonthly(req, res) {
  const months = Number(req.query.months) || 6;
  const now = new Date();

  // First day of the oldest month, and the first day of next month (exclusive end)
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const rows = await Transaction.aggregate([
    { $match: { user: req.user._id, date: { $gte: start, $lt: end } } },
    {
      // Group by "YYYY-MM" AND type, so we get one row per month per type
      $group: {
        _id: { month: { $dateToString: { format: "%Y-%m", date: "$date" } }, type: "$type" },
        total: { $sum: "$amount" },
      },
    },
  ]);

  // MongoDB only returns months that have data, so we build the full list ourselves
  // and fill in 0 for months with no transactions (the chart needs every month).
  const result = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1));
    const month = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;

    const find = (type) => rows.find((r) => r._id.month === month && r._id.type === type)?.total || 0;
    result.push({ month, income: round(find("income")), expense: round(find("expense")) });
  }

  res.json(result);
}

module.exports = { getSummary, getByCategory, getMonthly };
