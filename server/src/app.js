
// const express = require("express");
// const cors = require("cors");

// const { pool } = require("./config/db");

// const app = express();

// // Middleware
// app.use(cors({
//   origin: "http://localhost:5173",
// }));

// app.use(express.json());

// // Basic API route
// app.get("/", (req, res) => {
//   res.json({
//     message: "Welcome to Sweety Blood Glucose Tracker API",
//   });
// });

// // Database health check
// app.get("/api/health", async (req, res) => {
//   try {
//     await pool.query("SELECT 1");

//     res.status(200).json({
//       status: "success",
//       message: "Backend and PostgreSQL are connected",
//     });
//   } catch (error) {
//     console.error("Health check failed:", error.message);

//     res.status(503).json({
//       status: "error",
//       message: "Database connection unavailable",
//     });
//   }
// });

// // Handle unknown routes
// app.use((req, res) => {
//   res.status(404).json({
//     message: "API endpoint not found",
//   });
// });

// module.exports = app;


const express = require("express");
const cors = require("cors");

const { pool } = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
}));

app.use(express.json({ limit: "10kb" }));

// API home
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Sweety Blood Glucose Tracker API",
  });
});

// Database health check
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    return res.status(200).json({
      status: "success",
      message: "Backend and PostgreSQL are connected",
    });
  } catch (error) {
    console.error("Health check failed:", error.message);

    return res.status(503).json({
      status: "error",
      message: "Database connection unavailable",
    });
  }
});

// Authentication API
app.use("/api/auth", authRoutes);

// Invalid JSON and other errors
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400) {
    return res.status(400).json({
      message: "Invalid JSON request body.",
    });
  }

  console.error("Request error:", error.message);

  return res.status(error.status || 500).json({
    message: error.status && error.status < 500
      ? "Invalid request."
      : "Internal server error.",
  });
});

// Unknown API paths
app.use((req, res) => {
  res.status(404).json({
    message: "API endpoint not found",
  });
});

module.exports = app;
