
import request from "supertest";

import app from "../src/app.js";
import db from "../src/config/db.js";

export const pool = db.pool;

// Clear only the dedicated test database
export async function resetDatabase() {
  if (
    process.env.NODE_ENV !== "test" ||
    process.env.DB_NAME !== "sweety_test_db"
  ) {
    throw new Error("Refusing to reset a non-test database.");
  }

  await pool.query(
    "TRUNCATE TABLE readings, users RESTART IDENTITY CASCADE"
  );
}

// Register a fresh user and return their JWT
export async function createTestUser(
  email = "test@example.com",
  password = "TestPass123!"
) {
  const response = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Test User",
      email,
      password,
    });

  if (response.status !== 201) {
    throw new Error(
      `Test user registration failed: ${JSON.stringify(response.body)}`
    );
  }

  return {
    user: response.body.user,
    token: response.body.token,
    password,
  };
}

// Create a reading through the real HTTP API
export async function addTestReading(
  token,
  reading_date,
  slot,
  value
) {
  return request(app)
    .post("/api/readings")
    .set("Authorization", `Bearer ${token}`)
    .send({
      reading_date,
      slot,
      value,
    });
}

export { app, request };
