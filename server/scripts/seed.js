
require("dotenv").config();

const bcrypt = require("bcrypt");
const { pool } = require("../src/config/db");

const DEMO_USER = {
  name: "Sweety Demo",
  email: "sweety.demo@example.com",
  password: "SweetyDemo123!",
};

const SAMPLE_READINGS = [
  ["2026-10-15", "morning", 110],
  ["2026-10-15", "after_breakfast", 145],
  ["2026-10-15", "after_lunch", 160],
  ["2026-10-15", "after_dinner", 130],

  ["2026-10-01", "morning", 100],
  ["2026-10-10", "morning", 120],

  ["2026-09-12", "morning", 90],
  ["2026-09-30", "after_dinner", 150],
];

async function seed() {
  const host = process.env.DB_HOST;
  const database = process.env.DB_NAME;

  // Protect production and test databases.
  if (
    process.env.NODE_ENV === "production" ||
    !["localhost", "127.0.0.1"].includes(host) ||
    database !== "sweety_db"
  ) {
    throw new Error(
      "Seed script only supports local sweety_db."
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const passwordHash = await bcrypt.hash(
      DEMO_USER.password,
      12
    );

    // Insert demo user, or update existing demo account
    const userResult = await client.query(
      `INSERT INTO users
        (name, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email)
       DO UPDATE SET
         name = EXCLUDED.name,
         password_hash = EXCLUDED.password_hash
       RETURNING id, name, email`,
      [
        DEMO_USER.name,
        DEMO_USER.email,
        passwordHash,
      ]
    );

    const user = userResult.rows[0];

    // Remove only this demo user's previous readings
    // so the seed produces the same data every time.
    await client.query(
      "DELETE FROM readings WHERE user_id = $1",
      [user.id]
    );

    // Insert eight sample readings
    for (const [date, slot, value] of SAMPLE_READINGS) {
      await client.query(
        `INSERT INTO readings
          (user_id, reading_date, slot, value)
         VALUES ($1, $2, $3, $4)`,
        [user.id, date, slot, value]
      );
    }

    await client.query("COMMIT");

    console.log("Sweety demo data created successfully.");
    console.log(`Demo email: ${DEMO_USER.email}`);
    console.log(`Demo password: ${DEMO_USER.password}`);
    console.log(`Readings created: ${SAMPLE_READINGS.length}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
