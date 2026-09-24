// Run with: npm run seed
// Creates a demo user (demo@example.com / Demo@1234) with sample transactions
// over the last 6 months so the dashboard charts look good straight away.
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Transaction = require("./models/Transaction");

const DEMO = { name: "Demo User", email: "demo@example.com", password: "Demo@1234" };

// [months ago, day of month, type, category, amount (Rs), note]
const SAMPLE = [
  // 5 months ago
  [5, 1, "income", "Salary", 120000, "Monthly salary"],
  [5, 3, "expense", "Rent", 35000, "House rent"],
  [5, 9, "expense", "Food", 6200, "Groceries"],
  [5, 16, "expense", "Bills", 9800, "Electricity and gas"],
  // 4 months ago
  [4, 1, "income", "Salary", 120000, "Monthly salary"],
  [4, 12, "income", "Freelance", 30000, "Website project"],
  [4, 3, "expense", "Rent", 35000, "House rent"],
  [4, 8, "expense", "Food", 5400, "Groceries"],
  [4, 20, "expense", "Transport", 3200, "Fuel"],
  // 3 months ago
  [3, 1, "income", "Salary", 120000, "Monthly salary"],
  [3, 18, "income", "Gift", 5000, "Birthday gift"],
  [3, 3, "expense", "Rent", 35000, "House rent"],
  [3, 10, "expense", "Bills", 11200, "Internet and electricity"],
  [3, 22, "expense", "Health", 4500, "Doctor visit"],
  // 2 months ago
  [2, 1, "income", "Salary", 120000, "Monthly salary"],
  [2, 14, "income", "Freelance", 42000, "Logo design"],
  [2, 3, "expense", "Rent", 35000, "House rent"],
  [2, 11, "expense", "Education", 15000, "Online course"],
  // 1 month ago
  [1, 1, "income", "Salary", 120000, "Monthly salary"],
  [1, 3, "expense", "Rent", 35000, "House rent"],
  [1, 9, "expense", "Food", 6800, "Groceries"],
  [1, 19, "expense", "Entertainment", 3600, "Cinema and dinner"],
  // This month (days are capped to today below so nothing is in the future)
  [0, 1, "income", "Salary", 125000, "Monthly salary"],
  [0, 2, "expense", "Rent", 35000, "House rent"],
  [0, 3, "expense", "Food", 4300, "Groceries"],
  [0, 4, "expense", "Transport", 2600, "Fuel"],
  [0, 5, "expense", "Shopping", 7900, "Clothes"],
  [0, 6, "expense", "Bills", 8900, "Electricity and gas"],
];

function buildDate(monthsAgo, day) {
  const now = new Date();
  // Date.UTC handles going back past January (e.g. month -2 becomes November)
  const month = now.getUTCMonth() - monthsAgo;
  // In the current month, never use a day later than today
  const safeDay = monthsAgo === 0 ? Math.min(day, now.getUTCDate()) : day;
  return new Date(Date.UTC(now.getUTCFullYear(), month, safeDay));
}

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is missing. Copy .env.example to .env and fill it in.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  // Remove the old demo user and their transactions so the seed can be re-run safely
  const oldUser = await User.findOne({ email: DEMO.email });
  if (oldUser) {
    await Transaction.deleteMany({ user: oldUser._id });
    await User.deleteOne({ _id: oldUser._id });
  }

  const user = await User.create(DEMO);

  const transactions = SAMPLE.map(([monthsAgo, day, type, category, amount, note]) => ({
    user: user._id,
    type,
    category,
    amount,
    note,
    date: buildDate(monthsAgo, day),
  }));
  await Transaction.insertMany(transactions);

  console.log(`Seeded demo user (${DEMO.email}) with ${transactions.length} transactions.`);
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error("Seeding failed:", error.message);
  await mongoose.disconnect();
  process.exit(1);
});
