// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  /* Sequential – tests share a live backend with a real SQLite DB */
  fullyParallel: false,
  /* Fail the build on CI if test.only is accidentally left in source */
  forbidOnly: !!process.env.CI,
  /* Retry twice on CI, zero locally */
  retries: process.env.CI ? 2 : 0,
  /* Both list (terminal) and HTML reporters */
  reporter: [['html'], ['list']],

  /* Visual-regression snapshot settings */
  expect: {
    toHaveScreenshot: {
      /* Allow up to 0.2% pixel difference to tolerate sub-pixel rendering */
      maxDiffPixelRatio: 0.002,
      /* Animations can cause noise – disable them during snapshot capture */
      animations: 'disabled',
    },
  },

  /* Shared settings for all projects */
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    /* ── Desktop browsers ───────────────────────────────────────── */
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // Runs ALL tests including visual regression
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      // Skip visual regression – snapshots are per-browser; baseline is Chromium
      testIgnore: '**/visual.spec.js',
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: '**/visual.spec.js',
    },

    /* ── Mobile viewports ───────────────────────────────────────── */
    // The employee table is not mobile-optimized; action buttons require
    // horizontal scroll. Run only login + API-mocking tests on mobile.
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
      testIgnore: ['**/visual.spec.js', '**/employees.spec.js'],
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14'] },
      testIgnore: ['**/visual.spec.js', '**/employees.spec.js'],
    },
  ],
});
