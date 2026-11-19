
const express = require("express");

const authenticate = require("../middleware/authMiddleware");

const {
  createReading,
  getReadings,
  getReadingById,
  updateReading,
  deleteReading,
} = require("../controllers/readingController");

const router = express.Router();

// All reading routes require a valid JWT
router.use(authenticate);

router.post("/", createReading);
router.get("/", getReadings);
router.get("/:id", getReadingById);
router.put("/:id", updateReading);
router.delete("/:id", deleteReading);

module.exports = router;
