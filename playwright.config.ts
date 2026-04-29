import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "reports/playwright/artifacts",
  reporter: process.env.CI
    ? [["list"], ["junit", { outputFile: "reports/playwright/junit.xml" }], ["blob", { outputDir: "reports/playwright/blob" }]]
    : [["list"], ["html", { outputFolder: "reports/playwright/html", open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1",
    url: "http://127.0.0.1:3000",
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
