// Single source of truth for transaction types and categories on the server.
// (The client has a matching list in client/src/utils/constants.ts - keep them in sync.)
const CATEGORIES = {
  income: ["Salary", "Freelance", "Gift", "Other"],
  expense: [
    "Food",
    "Transport",
    "Rent",
    "Bills",
    "Shopping",
    "Health",
    "Education",
    "Entertainment",
    "Other",
  ],
};

const TRANSACTION_TYPES = Object.keys(CATEGORIES); // ["income", "expense"]

// Every category name from both types, without duplicates (used by the list filter)
const ALL_CATEGORIES = [...new Set([...CATEGORIES.income, ...CATEGORIES.expense])];

module.exports = { CATEGORIES, TRANSACTION_TYPES, ALL_CATEGORIES };
