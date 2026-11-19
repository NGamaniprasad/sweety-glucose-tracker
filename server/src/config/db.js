
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error.message);
});

const testConnection = async () => {
  const result = await pool.query(
    "SELECT current_database() AS database_name"
  );

  console.log(
    `PostgreSQL connected: ${result.rows[0].database_name}`
  );
};

module.exports = { pool, testConnection };
