import { defineConfig, devices } from "@playwright/test";

// Chromium-only for now (not the full Chromium/Firefox/WebKit matrix) to keep
// this prototype's test setup lightweight; add more `projects` entries if
// cross-browser coverage becomes worth the extra CI time.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
  },
  webServer: {
    // The app is statically exported (output: "export" in next.config.ts) and
    // served by FastAPI in production, so tests serve the same `out/` build
    // rather than running `next start` (which static exports don't support).
    command: "npm run build && npx serve out -l 3100 -s --no-clipboard",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
