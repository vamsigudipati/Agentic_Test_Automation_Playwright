// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Group Activity Test Suite
 * Covers three testing layers:
 *   - e2e/       Playwright browser E2E tests
 *   - backend/   REST API tests (using Playwright request fixture)
 *   - bdd/       BDD-style specs (Given/When/Then via test.step)
 */
module.exports = defineConfig({
  testDir: '.',
  // Tests within a single file run sequentially to avoid SQLite DB conflicts.
  // Cross-file parallelism is enabled via `workers` below.
  fullyParallel: false,
  // Allow up to 3 parallel workers (one per browser project) in dev;
  // keep sequential in CI to avoid resource contention.
  workers: process.env.CI ? 1 : 3,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html'], ['list']],

  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.002,
      animations: 'disabled',
    },
  },

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: '**/visual*.spec.js',
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: '**/visual*.spec.js',
    },
  ],
});
