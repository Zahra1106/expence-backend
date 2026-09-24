const express = require("express");
const {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = require("../controllers/transactionController");
const { protect } = require("../middleware/auth");
const {
  listRules,
  transactionRules,
  idRule,
  handleValidation,
} = require("../middleware/validators");

const router = express.Router();

// PROTECTED ROUTES: every route below needs a valid token
router.use(protect);

router.get("/", listRules, handleValidation, getTransactions);
router.post("/", transactionRules, handleValidation, createTransaction);
router.put("/:id", idRule, transactionRules, handleValidation, updateTransaction);
router.delete("/:id", idRule, handleValidation, deleteTransaction);

module.exports = router;
