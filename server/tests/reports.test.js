
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

describe("Glucose Report APIs", () => {
  let token;

  beforeEach(async () => {
    await resetDatabase();

    const user = await createTestUser();
    token = user.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  // Populate sample values in three different periods
  async function seedReportReadings() {
    const samples = [
      [DATE, "morning", 110],
      [DATE, "after_breakfast", 145],
      [DATE, "after_lunch", 160],
      [DATE, "after_dinner", 130],

      ["2026-10-01", "morning", 100],
      ["2026-10-10", "morning", 120],

      ["2026-09-12", "morning", 90],
      ["2026-09-30", "after_dinner", 150],
    ];

    for (const [date, slot, value] of samples) {
      const response = await addTestReading(
        token, date, slot, value
      );

      expect(response.status).toBe(201);
    }
  }

  it("generates the correct daily report", async () => {
    await seedReportReadings();

    const response = await request(app)
      .get(`/api/reports/daily?date=${DATE}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    const report = response.body;

    expect(report.report_type).toBe("daily");
    expect(report.count).toBe(4);
    expect(report.highest).toBe(160);
    expect(report.lowest).toBe(110);
    expect(report.average).toBe(136.3);
    expect(report.readings).toHaveLength(4);

    expect(report.date_range).toEqual({
      start: DATE,
      end: DATE,
    });

    expect(report.readings.map((r) => r.slot)).toEqual([
      "morning",
      "after_breakfast",
      "after_lunch",
      "after_dinner",
    ]);
  });

  it("generates the correct month-to-date report", async () => {
    await seedReportReadings();

    const response = await request(app)
      .get(`/api/reports/month-to-date?date=${DATE}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    const report = response.body;

    expect(report.report_type).toBe("month_to_date");
    expect(report.count).toBe(6);
    expect(report.highest).toBe(160);
    expect(report.lowest).toBe(100);
    expect(report.average).toBe(127.5);

    expect(report.date_range).toEqual({
      start: "2026-10-01",
      end: "2026-10-15",
    });
  });

  it("generates the correct previous-month report", async () => {
    await seedReportReadings();

    const response = await request(app)
      .get(`/api/reports/previous-month?date=${DATE}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    const report = response.body;

    expect(report.report_type).toBe("previous_month");
    expect(report.count).toBe(2);
    expect(report.highest).toBe(150);
    expect(report.lowest).toBe(90);
    expect(report.average).toBe(120);

    expect(report.date_range).toEqual({
      start: "2026-09-01",
      end: "2026-09-30",
    });
  });

  it("returns a friendly empty daily report", async () => {
    const response = await request(app)
      .get("/api/reports/daily?date=2026-08-15")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.count).toBe(0);
    expect(response.body.highest).toBeNull();
    expect(response.body.lowest).toBeNull();
    expect(response.body.average).toBeNull();

    expect(response.body.has_data).toBe(false);
    expect(response.body.readings).toEqual([]);

    expect(response.body.message).toBe(
      "No glucose readings found for this period."
    );
  });

  it("rejects invalid report dates", async () => {
    const response = await request(app)
      .get("/api/reports/daily?date=2026-02-30")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
  });

  it("rejects future report dates", async () => {
    const response = await request(app)
      .get("/api/reports/daily?date=2099-12-31")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
  });

  it("requires authentication for reports", async () => {
    const endpoints = [
      "/api/reports/daily",
      "/api/reports/month-to-date",
      "/api/reports/previous-month",
    ];

    for (const endpoint of endpoints) {
      const response = await request(app)
        .get(`${endpoint}?date=${DATE}`);

      expect(response.status).toBe(401);
    }
  });

  it("only includes the authenticated user's readings", async () => {
    await addTestReading(
      token, DATE, "morning", 110
    );

    const otherUser = await createTestUser(
      "second@example.com"
    );

    const response = await request(app)
      .get(`/api/reports/daily?date=${DATE}`)
      .set(
        "Authorization",
        `Bearer ${otherUser.token}`
      );

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(0);
    expect(response.body.readings).toEqual([]);
  });

  it("uses the previous calendar year for January", async () => {
    const response = await request(app)
      .get(
        "/api/reports/previous-month?date=2026-01-15"
      )
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.date_range).toEqual({
      start: "2025-12-01",
      end: "2025-12-31",
    });
  });

  it("handles leap-year February correctly", async () => {
    const response = await request(app)
      .get(
        "/api/reports/previous-month?date=2024-03-15"
      )
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.date_range).toEqual({
      start: "2024-02-01",
      end: "2024-02-29",
    });
  });
});
