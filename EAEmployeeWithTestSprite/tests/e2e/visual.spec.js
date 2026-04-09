// @ts-check
/**
 * Visual Regression Tests
 *
 * Only runs on Chromium (configured via testIgnore in playwright.config.js for
 * Firefox / WebKit to keep snapshots browser-consistent).
 *
 * FIRST RUN: Playwright creates baseline snapshots in
 *   e2e/visual.spec.js-snapshots/
 * SUBSEQUENT RUNS: Each screenshot is compared against its baseline.
 *   To update baselines after intentional UI changes run:
 *   npx playwright test --update-snapshots visual.spec.js
 */
const { test, expect } = require('@playwright/test');

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function setLoggedIn(page, username = 'admin') {
  await page.goto('/login');
  await page.evaluate((u) => {
    localStorage.setItem('loggedIn', 'true');
    localStorage.setItem('username', u);
  }, username);
}

const MOCK_EMPLOYEES = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', position: 'Engineer' },
  { id: 2, name: 'Bob Smith',    email: 'bob@example.com',   position: 'Designer' },
  { id: 3, name: 'Carol White',  email: 'carol@example.com', position: 'Manager'  },
];

/** Mock GET /api/employees to return stable data independent of the real DB. */
async function mockEmployees(page, employees = MOCK_EMPLOYEES) {
  await page.route('**/api/employees', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(employees),
      });
    }
    return route.continue();
  });
}

// ─── Login Page ───────────────────────────────────────────────────────────────

test.describe('Visual – Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/login');
  });

  test('login page – light mode', async ({ page }) => {
    // Wait for the form to fully render
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    await expect(page).toHaveScreenshot('login-light.png');
  });

  test('login page – dark mode', async ({ page }) => {
    // The theme IconButton has no aria-label; target the SVG icon's data-testid
    await page.locator('[data-testid^="Brightness"]').click();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    await expect(page).toHaveScreenshot('login-dark.png');
  });

  test('login page – with invalid credentials error', async ({ page }) => {
    await page.route('**/api/login', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Invalid username or password' }),
      })
    );

    await page.getByLabel('Username', { exact: false }).fill('baduser');
    await page.getByLabel('Password', { exact: false }).fill('badpass');
    await page.getByRole('button', { name: 'Login' }).click();

    // Wait for the error to appear before snapping
    await expect(page.locator('text=/invalid/i').first()).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveScreenshot('login-error.png');
  });
});

// ─── Employee List Page ───────────────────────────────────────────────────────

test.describe('Visual – Employee List Page', () => {
  test('employee list – populated with data', async ({ page }) => {
    await setLoggedIn(page);
    await mockEmployees(page);
    await page.goto('/list');

    // Wait for all rows to be visible before snapshot
    await expect(page.getByRole('cell', { name: 'Alice Johnson' })).toBeVisible({ timeout: 6000 });
    await expect(page.locator('tbody tr')).toHaveCount(3);

    await expect(page).toHaveScreenshot('employee-list-populated.png');
  });

  test('employee list – empty state', async ({ page }) => {
    await setLoggedIn(page);
    await mockEmployees(page, []);
    await page.goto('/list');

    await expect(page.getByText('No employees found.')).toBeVisible({ timeout: 6000 });
    await expect(page).toHaveScreenshot('employee-list-empty.png');
  });

  test('employee list – dark mode', async ({ page }) => {
    await setLoggedIn(page);
    await mockEmployees(page);
    await page.goto('/list');
    await expect(page.getByRole('cell', { name: 'Alice Johnson' })).toBeVisible({ timeout: 6000 });

    // Toggle dark mode – target the SVG icon data-testid (no aria-label on the IconButton)
    await page.locator('[data-testid^="Brightness"]').click();
    await expect(page).toHaveScreenshot('employee-list-dark.png');
  });

  test('employee list – search results filtered', async ({ page }) => {
    await setLoggedIn(page);
    await mockEmployees(page);
    await page.goto('/list');
    await expect(page.getByRole('cell', { name: 'Alice Johnson' })).toBeVisible({ timeout: 6000 });

    await page.getByLabel('Search employees', { exact: false }).fill('Alice');
    await expect(page.locator('tbody tr')).toHaveCount(1);

    await expect(page).toHaveScreenshot('employee-list-search.png');
  });
});

// ─── Dialogs ──────────────────────────────────────────────────────────────────

test.describe('Visual – Dialogs', () => {
  test.beforeEach(async ({ page }) => {
    await setLoggedIn(page);
    await mockEmployees(page);
    await page.goto('/list');
    await expect(page.getByRole('cell', { name: 'Alice Johnson' })).toBeVisible({ timeout: 6000 });
  });

  test('dialog – Add Employee form', async ({ page }) => {
    await page.getByRole('button', { name: /add employee/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('[class*="MuiDialogTitle"]')).toContainText('Add Employee');

    await expect(page).toHaveScreenshot('dialog-add-employee.png');
  });

  test('dialog – View Employee details', async ({ page }) => {
    await page.locator('tbody tr').first().getByRole('button', { name: /view/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Employee Details')).toBeVisible();

    await expect(page).toHaveScreenshot('dialog-view-employee.png');
  });

  test('dialog – Edit Employee form', async ({ page }) => {
    await page.locator('tbody tr').first().getByRole('button', { name: /edit/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('[class*="MuiDialogTitle"]')).toContainText('Edit Employee');

    await expect(page).toHaveScreenshot('dialog-edit-employee.png');
  });

  test('dialog – Delete Employee confirmation', async ({ page }) => {
    await page.locator('tbody tr').first().getByRole('button', { name: /delete/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Delete Employee' })).toBeVisible();

    await expect(page).toHaveScreenshot('dialog-delete-employee.png');
  });
});
