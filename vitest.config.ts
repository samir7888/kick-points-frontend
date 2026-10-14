import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": resolve(fileURLToPath(new URL(".", import.meta.url))) } },
  test: { environment: "jsdom", setupFiles: ["./tests/setup.ts"], include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"] }
});
