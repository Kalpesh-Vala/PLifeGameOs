import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Enable field encryption during tests so round-trip specs exercise the
    // real cipher path rather than the plaintext no-op.
    env: {
      ENCRYPTION_KEY: "test-encryption-key-do-not-use-in-prod",
    },
  },
});
