
const express = require("express");

const authenticate = require("../middleware/authMiddleware");

const {
  getDailyReport,
  getMonthToDateReport,
  getPreviousMonthReport,
} = require("../controllers/reportController");

const router = express.Router();

// Every report requires JWT authentication
router.use(authenticate);

router.get("/daily", getDailyReport);

router.get("/month-to-date", getMonthToDateReport);

router.get("/previous-month", getPreviousMonthReport);

module.exports = router;
