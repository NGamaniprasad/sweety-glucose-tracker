
import {
  describe,
  it,
  expect,
  beforeEach,
  afterAll,
} from "vitest";

import {
  app,
  request,
  pool,
  resetDatabase,
  createTestUser,
} from "./helpers.js";

describe("Authentication API", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await pool.end();
  });

  it("registers a valid user", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Demo User",
        email: "demo@example.com",
        password: "DemoPass123!",
      });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe(
      "demo@example.com"
    );
    expect(response.body.token).toBeTypeOf("string");
    expect(response.body.user.password_hash).toBeUndefined();
  });

  it("stores a bcrypt hash, not plain text", async () => {
    await createTestUser();

    const result = await pool.query(
      "SELECT password_hash FROM users WHERE email = $1",
      ["test@example.com"]
    );

    const hash = result.rows[0].password_hash;

    expect(hash).not.toBe("TestPass123!");
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it("rejects duplicate emails", async () => {
    await createTestUser();

    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Another User",
        email: "test@example.com",
        password: "AnotherPass123!",
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe(
      "Email already registered."
    );
  });

  it("rejects missing registration fields", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        email: "demo@example.com",
        password: "DemoPass123!",
      });

    expect(response.status).toBe(400);
  });

  it("logs in with valid credentials", async () => {
    await createTestUser();

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "test@example.com",
        password: "TestPass123!",
      });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeTypeOf("string");
    expect(response.body.user.email).toBe(
      "test@example.com"
    );
  });

  it("rejects the wrong password", async () => {
    await createTestUser();

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "test@example.com",
        password: "WrongPassword123",
      });

    expect(response.status).toBe(401);
    expect(response.body.token).toBeUndefined();
  });

  it("rejects profile requests without JWT", async () => {
    const response = await request(app)
      .get("/api/auth/me");

    expect(response.status).toBe(401);
  });

  it("returns profile with valid JWT", async () => {
    const { token } = await createTestUser();

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(
      "test@example.com"
    );
  });
});
