
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",

    include: ["tests/**/*.test.js"],

    setupFiles: ["./tests/setup.js"],

    // Prevent parallel test files from clearing
    // each other's records in PostgreSQL
    fileParallelism: false,

    maxWorkers: 1,
    minWorkers: 1,

    testTimeout: 15000,
    hookTimeout: 15000,

    clearMocks: true,
  },
});
