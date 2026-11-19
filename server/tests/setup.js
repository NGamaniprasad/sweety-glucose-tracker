
import dotenv from "dotenv";
import { resolve } from "node:path";

// Load test environment before backend modules
dotenv.config({
  path: resolve(process.cwd(), ".env.test"),
  override: true,
});

// Safety check: never run destructive tests
// against your development database
if (
  process.env.NODE_ENV !== "test" ||
  process.env.DB_NAME !== "sweety_test_db"
) {
  throw new Error(
    "Tests must use NODE_ENV=test and DB_NAME=sweety_test_db"
  );
}

if (!process.env.JWT_SECRET || !process.env.DB_PASSWORD) {
  throw new Error(
    "Missing JWT_SECRET or DB_PASSWORD in .env.test"
  );
}
