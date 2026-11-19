
const { getReport } = require("../services/reportService");

const {
  isValidDate,
  formatLocalDate,
} = require("../utils/validation");

// Common controller for all three report types
const generateReport = (reportType) => {
  return async (req, res) => {
    const selectedDate =
      req.query.date === undefined
        ? formatLocalDate(new Date())
        : req.query.date;

    // Validate calendar date
    if (!isValidDate(selectedDate)) {
      return res.status(400).json({
        message: "Please enter a valid date (YYYY-MM-DD).",
      });
    }

    // Prevent selecting future dates
    const today = formatLocalDate(new Date());

    if (selectedDate > today) {
      return res.status(400).json({
        message: "Date cannot be in the future.",
      });
    }

    try {
      // User identity comes only from the verified JWT
      const userId = req.user.userId;

      const report = await getReport(
        userId,
        selectedDate,
        reportType
      );

      return res.status(200).json(report);

    } catch (error) {
      console.error("Report error:", error.message);

      return res.status(500).json({
        message: "Unable to generate report. Please try again.",
      });
    }
  };
};

const getDailyReport = generateReport("daily");

const getMonthToDateReport = generateReport(
  "month_to_date"
);

const getPreviousMonthReport = generateReport(
  "previous_month"
);

module.exports = {
  getDailyReport,
  getMonthToDateReport,
  getPreviousMonthReport,
};
