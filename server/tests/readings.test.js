
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
  addTestReading,
} from "./helpers.js";

const DATE = "2026-10-15";

describe("Glucose Reading API", () => {
  let token;

  beforeEach(async () => {
    await resetDatabase();

    const user = await createTestUser();
    token = user.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  it("creates a valid reading", async () => {
    const response = await addTestReading(
      token, DATE, "morning", 110
    );

    expect(response.status).toBe(201);
    expect(response.body.reading.value).toBe(110);
    expect(response.body.reading.slot).toBe("morning");
  });

  it("lists the authenticated user's readings", async () => {
    await addTestReading(token, DATE, "morning", 110);
    await addTestReading(
      token, DATE, "after_breakfast", 145
    );

    const response = await request(app)
      .get("/api/readings")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(2);
    expect(response.body.readings).toHaveLength(2);
  });

  it("retrieves one reading by ID", async () => {
    const created = await addTestReading(
      token, DATE, "morning", 110
    );

    const id = created.body.reading.id;

    const response = await request(app)
      .get(`/api/readings/${id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.reading.value).toBe(110);
  });

  it("updates an existing reading", async () => {
    const created = await addTestReading(
      token, DATE, "morning", 110
    );

    const id = created.body.reading.id;

    const response = await request(app)
      .put(`/api/readings/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        reading_date: DATE,
        slot: "morning",
        value: 125,
      });

    expect(response.status).toBe(200);
    expect(response.body.reading.value).toBe(125);
  });

  it("deletes an existing reading", async () => {
    const created = await addTestReading(
      token, DATE, "morning", 110
    );

    const id = created.body.reading.id;

    const removed = await request(app)
      .delete(`/api/readings/${id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(removed.status).toBe(200);

    const lookup = await request(app)
      .get(`/api/readings/${id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(lookup.status).toBe(404);
  });

  // Validation 1: Value required
  it("rejects missing glucose value", async () => {
    const response = await request(app)
      .post("/api/readings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        reading_date: DATE,
        slot: "morning",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Please enter a glucose value."
    );
  });

  // Validation 2: Whole number, 40–600
  it.each([39, 601, 110.5, "abc"])(
    "rejects invalid glucose value %s",
    async (value) => {
      const response = await addTestReading(
        token, DATE, "morning", value
      );

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Value must be between 40 and 600 mg/dl."
      );
    }
  );

  it.each([40, 600])(
    "accepts boundary glucose value %s",
    async (value) => {
      const response = await addTestReading(
        token, DATE, "morning", value
      );

      expect(response.status).toBe(201);
    }
  );

  // Validation 3: Duplicate slot
  it("rejects a duplicate time slot", async () => {
    await addTestReading(token, DATE, "morning", 110);

    const response = await addTestReading(
      token, DATE, "morning", 120
    );

    expect(response.status).toBe(409);
    expect(response.body.message).toContain(
      "Morning (fasting) reading for this date"
    );
  });

  // Validation 4: Maximum four per day
  it("rejects a fifth reading on the same day", async () => {
    const slots = [
      "morning",
      "after_breakfast",
      "after_lunch",
      "after_dinner",
    ];

    for (const slot of slots) {
      const response = await addTestReading(
        token, DATE, slot, 110
      );

      expect(response.status).toBe(201);
    }

    const fifth = await addTestReading(
      token, DATE, "morning", 130
    );

    expect(fifth.status).toBe(400);
    expect(fifth.body.message).toBe(
      "You can add only 4 readings per day."
    );
  });

  // Validation 5: Future date
  it("rejects a future date", async () => {
    const response = await addTestReading(
      token, "2099-12-31", "morning", 110
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Date cannot be in the future."
    );
  });

  it("rejects invalid calendar dates", async () => {
    const response = await addTestReading(
      token, "2026-02-30", "morning", 110
    );

    expect(response.status).toBe(400);
  });

  it("filters readings by date", async () => {
    await addTestReading(
      token, "2026-10-15", "morning", 110
    );

    await addTestReading(
      token, "2026-10-14", "morning", 140
    );

    const response = await request(app)
      .get("/api/readings?date=2026-10-15")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(1);
    expect(response.body.readings[0].value).toBe(110);
  });

  it("rejects reading requests without JWT", async () => {
    const response = await request(app)
      .get("/api/readings");

    expect(response.status).toBe(401);
  });

  it("prevents users accessing other users' readings", async () => {
    const created = await addTestReading(
      token, DATE, "morning", 110
    );

    const readingId = created.body.reading.id;

    const otherUser = await createTestUser(
      "other@example.com"
    );

    const otherToken = otherUser.token;
    const authorization = `Bearer ${otherToken}`;

    // Other user's list must not show first user's data
    const list = await request(app)
      .get("/api/readings")
      .set("Authorization", authorization);

    expect(list.status).toBe(200);
    expect(list.body.count).toBe(0);

    // Other user cannot fetch first user's reading
    const get = await request(app)
      .get(`/api/readings/${readingId}`)
      .set("Authorization", authorization);

    expect(get.status).toBe(404);

    // Other user cannot update it
    const update = await request(app)
      .put(`/api/readings/${readingId}`)
      .set("Authorization", authorization)
      .send({
        reading_date: DATE,
        slot: "morning",
        value: 500,
      });

    expect(update.status).toBe(404);

    // Other user cannot delete it
    const remove = await request(app)
      .delete(`/api/readings/${readingId}`)
      .set("Authorization", authorization);

    expect(remove.status).toBe(404);

    // Original reading remains unchanged
    const original = await request(app)
      .get(`/api/readings/${readingId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(original.status).toBe(200);
    expect(original.body.reading.value).toBe(110);
  });
});
