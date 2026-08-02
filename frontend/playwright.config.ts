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
    // Tests run against a production build, per Next.js's testing guide, so
    // behavior matches what actually ships.
    command: "npm run build && npm run start -- -p 3100",
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
