import { defineConfig, devices } from "@playwright/test";
export default defineConfig({ testDir: "./tests/e2e", use: { baseURL: "http://127.0.0.1:3101", ...devices["Desktop Chrome"] }, webServer: { command: "pnpm dev --hostname 127.0.0.1 --port 3101", url: "http://127.0.0.1:3101", reuseExistingServer: false, env: { NEXT_DIST_DIR: ".next-e2e" } } });
