const { body, query, param, validationResult } = require("express-validator");
const { CATEGORIES, TRANSACTION_TYPES, ALL_CATEGORIES } = require("../config/constants");

// Put this AFTER the validation rules. If any rule failed, it stops the request
// and answers 400 with a list of what is wrong: { message, errors: [{ field, message }] }
function handleValidation(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  res.status(400).json({ message: "Validation failed", errors });
}

// ---------- Auth ----------
const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").trim().toLowerCase().isEmail().withMessage("Enter a valid email address"),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
];

const loginRules = [
  body("email").trim().toLowerCase().isEmail().withMessage("Enter a valid email address"),
  body("password").notEmpty().withMessage("Password is required"),
];

// ---------- Transactions ----------
// Same rules for creating (POST) and updating (PUT)
const transactionRules = [
  body("type").isIn(TRANSACTION_TYPES).withMessage("Type must be income or expense"),
  body("amount")
    .isFloat({ gt: 0 })
    .withMessage("Amount must be a number greater than 0")
    .toFloat(),
  body("category")
    .trim()
    // The allowed categories depend on the type (income vs expense)
    .custom((value, { req }) => (CATEGORIES[req.body.type] || []).includes(value))
    .withMessage("Category is not valid for this transaction type"),
  body("note").optional().trim().isLength({ max: 200 }).withMessage("Note must be 200 characters or less"),
  body("date").optional().isISO8601().withMessage("Date must be a valid date").toDate(),
];

const idRule = [param("id").isMongoId().withMessage("Invalid transaction id")];

// Note: we only check the query values here. The controller converts them to numbers.
const listRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be 1 or more"),
  query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("limit must be between 1 and 50"),
  query("type").optional().isIn(TRANSACTION_TYPES).withMessage("type must be income or expense"),
  query("category").optional().isIn(ALL_CATEGORIES).withMessage("Unknown category"),
  query("from").optional().isISO8601().withMessage("from must be a valid date"),
  query("to").optional().isISO8601().withMessage("to must be a valid date"),
  query("search").optional().isLength({ max: 100 }).withMessage("search is too long"),
];

// ---------- Reports ----------
const monthRule = [
  query("month")
    .optional()
    .matches(/^\d{4}-(0[1-9]|1[0-2])$/)
    .withMessage("month must look like YYYY-MM"),
];

const monthsRule = [
  query("months").optional().isInt({ min: 1, max: 24 }).withMessage("months must be between 1 and 24"),
];

module.exports = {
  handleValidation,
  registerRules,
  loginRules,
  transactionRules,
  idRule,
  listRules,
  monthRule,
  monthsRule,
};
