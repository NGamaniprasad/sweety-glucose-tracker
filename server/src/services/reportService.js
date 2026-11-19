
const { pool } = require("../config/db");

// Allowed reports and SQL date-range expressions
const REPORT_RANGES = {
  daily: {
    start: "$1::date",
    end: "$1::date",
  },

  month_to_date: {
    start: "date_trunc('month', $1::date)::date",
    end: "$1::date",
  },

  previous_month: {
    start:
      "(date_trunc('month', $1::date) - INTERVAL '1 month')::date",
    end:
      "(date_trunc('month', $1::date) - INTERVAL '1 day')::date",
  },
};

const getReport = async (userId, selectedDate, reportType) => {
  const range = REPORT_RANGES[reportType];

  if (!range) {
    throw new Error("Unsupported report type");
  }

  // 1. Calculate the report's exact calendar boundaries
  const rangeResult = await pool.query(
    `SELECT
       (${range.start})::text AS start_date,
       (${range.end})::text AS end_date`,
    [selectedDate]
  );

  const { start_date, end_date } = rangeResult.rows[0];

  // 2. Aggregate readings belonging to the logged-in user
  const statsResult = await pool.query(
    `SELECT
       COUNT(*)::int AS count,
       MAX(value) AS highest,
       MIN(value) AS lowest,
       ROUND(AVG(value)::numeric, 1) AS average
     FROM readings
     WHERE user_id = $1
       AND reading_date >= $2::date
       AND reading_date <= $3::date`,
    [userId, start_date, end_date]
  );

  const stats = statsResult.rows[0];
  const count = stats.count;
  const hasData = count > 0;

  const report = {
    report_type: reportType,
    selected_date: selectedDate,

    date_range: {
      start: start_date,
      end: end_date,
    },

    count,
    highest: hasData ? stats.highest : null,
    lowest: hasData ? stats.lowest : null,
    average: hasData ? Number(stats.average) : null,

    has_data: hasData,

    message: hasData
      ? "Report generated successfully."
      : "No glucose readings found for this period.",
  };

  // 3. Daily report must also include each reading and slot
  if (reportType === "daily") {
    const readingsResult = await pool.query(
      `SELECT
         id,
         reading_date::text AS reading_date,
         slot,
         value
       FROM readings
       WHERE user_id = $1
         AND reading_date = $2::date
       ORDER BY
         CASE slot
           WHEN 'morning' THEN 1
           WHEN 'after_breakfast' THEN 2
           WHEN 'after_lunch' THEN 3
           WHEN 'after_dinner' THEN 4
         END`,
      [userId, selectedDate]
    );

    report.readings = readingsResult.rows;
  }

  return report;
};

module.exports = {
  getReport,
};
