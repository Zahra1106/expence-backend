const express = require("express");
const { getSummary, getByCategory, getMonthly } = require("../controllers/reportController");
const { protect } = require("../middleware/auth");
const { monthRule, monthsRule, handleValidation } = require("../middleware/validators");

const router = express.Router();

// PROTECTED ROUTES: every route below needs a valid token
router.use(protect);

router.get("/summary", monthRule, handleValidation, getSummary);
router.get("/by-category", monthRule, handleValidation, getByCategory);
router.get("/monthly", monthsRule, handleValidation, getMonthly);

module.exports = router;
