
require("dotenv").config();

const app = require("./app");
const { testConnection, pool } = require("./config/db");

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    // Verify PostgreSQL before starting the API
    await testConnection();

    const server = app.listen(PORT, () => {
      console.log(`Sweety API running at http://localhost:${PORT}`);
    });

    server.on("error", (error) => {
      console.error("HTTP server error:", error.message);
      process.exitCode = 1;
      pool.end().catch(console.error);
    });

  } catch (error) {
    console.error(
      "Failed to start Sweety:",
      error.message
    );

    await pool.end();
    process.exitCode = 1;
  }
};

startServer();
