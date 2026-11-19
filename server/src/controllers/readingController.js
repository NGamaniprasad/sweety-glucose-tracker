
const { pool } = require("../config/db");

const {
  SLOTS,
  isValidDate,
  validateReading,
} = require("../utils/validation");

// Return dates as YYYY-MM-DD strings
const READING_FIELDS = `
  id,
  user_id,
  reading_date::text AS reading_date,
  slot,
  value,
  created_at
`;

const getReadingId = (rawId) => {
  if (!/^[1-9]\d*$/.test(rawId)) return null;

  const id = Number(rawId);

  // PostgreSQL SERIAL uses signed 32-bit integers
  return Number.isSafeInteger(id) && id <= 2147483647
    ? id
    : null;
};

// Handle expected database constraint errors
const handleDatabaseError = (error, res, slot) => {
  if (error.code === "23505") {
    return res.status(409).json({
      message: `You already have an ${SLOTS[slot]} reading for this date.`,
    });
  }

  if (error.code === "23514") {
    return res.status(400).json({
      message: "Invalid reading value or time slot.",
    });
  }

  console.error("Reading database error:", error.message);

  return res.status(500).json({
    message: "Unable to process reading. Please try again.",
  });
};

// POST /api/readings
const createReading = async (req, res) => {
  const validation = validateReading(req.body);

  if (validation.error) {
    return res.status(400).json({
      message: validation.error,
    });
  }

  const { reading_date, slot, value } = validation.data;
  const userId = req.user.userId;

  try {
    // First check whether this slot already has a reading
    const duplicate = await pool.query(
      `SELECT id FROM readings
       WHERE user_id = $1
         AND reading_date = $2
         AND slot = $3`,
      [userId, reading_date, slot]
    );

    if (duplicate.rowCount > 0) {
      return res.status(409).json({
        message: `You already have an ${SLOTS[slot]} reading for this date.`,
      });
    }

    // Enforce maximum four readings for the selected day
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM readings
       WHERE user_id = $1 AND reading_date = $2`,
      [userId, reading_date]
    );

    if (countResult.rows[0].count >= 4) {
      return res.status(400).json({
        message: "You can add only 4 readings per day.",
      });
    }

    const result = await pool.query(
      `INSERT INTO readings
         (user_id, reading_date, slot, value)
       VALUES ($1, $2, $3, $4)
       RETURNING ${READING_FIELDS}`,
      [userId, reading_date, slot, value]
    );

    return res.status(201).json({
      message: "Reading added successfully.",
      reading: result.rows[0],
    });

  } catch (error) {
    return handleDatabaseError(error, res, slot);
  }
};

// GET /api/readings
// Optional date filter: /api/readings?date=2026-11-19
const getReadings = async (req, res) => {
  const userId = req.user.userId;
  const { date } = req.query;

  if (date !== undefined && !isValidDate(date)) {
    return res.status(400).json({
      message: "Please enter a valid date (YYYY-MM-DD).",
    });
  }

  try {
    const params = [userId];
    let dateFilter = "";

    if (date) {
      params.push(date);
      dateFilter = "AND reading_date = $2";
    }

    const result = await pool.query(
      `SELECT ${READING_FIELDS}
       FROM readings
       WHERE user_id = $1
       ${dateFilter}
       ORDER BY reading_date DESC,
         CASE slot
           WHEN 'morning' THEN 1
           WHEN 'after_breakfast' THEN 2
           WHEN 'after_lunch' THEN 3
           WHEN 'after_dinner' THEN 4
         END ASC`,
      params
    );

    return res.status(200).json({
      count: result.rowCount,
      readings: result.rows,
    });

  } catch (error) {
    return handleDatabaseError(error, res);
  }
};

// GET /api/readings/:id
const getReadingById = async (req, res) => {
  const id = getReadingId(req.params.id);

  if (!id) {
    return res.status(400).json({
      message: "Invalid reading ID.",
    });
  }

  try {
    const result = await pool.query(
      `SELECT ${READING_FIELDS}
       FROM readings
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Reading not found.",
      });
    }

    return res.status(200).json({
      reading: result.rows[0],
    });

  } catch (error) {
    return handleDatabaseError(error, res);
  }
};

// PUT /api/readings/:id
const updateReading = async (req, res) => {
  const id = getReadingId(req.params.id);

  if (!id) {
    return res.status(400).json({
      message: "Invalid reading ID.",
    });
  }

  const validation = validateReading(req.body);

  if (validation.error) {
    return res.status(400).json({
      message: validation.error,
    });
  }

  const { reading_date, slot, value } = validation.data;
  const userId = req.user.userId;

  try {
    // Confirm that this reading belongs to this user
    const existing = await pool.query(
      `SELECT id FROM readings
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (existing.rowCount === 0) {
      return res.status(404).json({
        message: "Reading not found.",
      });
    }

    // Check for another reading in the requested slot
    const duplicate = await pool.query(
      `SELECT id FROM readings
       WHERE user_id = $1
         AND reading_date = $2
         AND slot = $3
         AND id <> $4`,
      [userId, reading_date, slot, id]
    );

    if (duplicate.rowCount > 0) {
      return res.status(409).json({
        message: `You already have an ${SLOTS[slot]} reading for this date.`,
      });
    }

    // Exclude this reading when counting the selected date
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM readings
       WHERE user_id = $1
         AND reading_date = $2
         AND id <> $3`,
      [userId, reading_date, id]
    );

    if (countResult.rows[0].count >= 4) {
      return res.status(400).json({
        message: "You can add only 4 readings per day.",
      });
    }

    const result = await pool.query(
      `UPDATE readings
       SET reading_date = $1,
           slot = $2,
           value = $3
       WHERE id = $4 AND user_id = $5
       RETURNING ${READING_FIELDS}`,
      [reading_date, slot, value, id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Reading not found.",
      });
    }

    return res.status(200).json({
      message: "Reading updated successfully.",
      reading: result.rows[0],
    });

  } catch (error) {
    return handleDatabaseError(error, res, slot);
  }
};

// DELETE /api/readings/:id
const deleteReading = async (req, res) => {
  const id = getReadingId(req.params.id);

  if (!id) {
    return res.status(400).json({
      message: "Invalid reading ID.",
    });
  }

  try {
    const result = await pool.query(
      `DELETE FROM readings
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, req.user.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Reading not found.",
      });
    }

    return res.status(200).json({
      message: "Reading deleted successfully.",
    });

  } catch (error) {
    return handleDatabaseError(error, res);
  }
};

module.exports = {
  createReading,
  getReadings,
  getReadingById,
  updateReading,
  deleteReading,
};
