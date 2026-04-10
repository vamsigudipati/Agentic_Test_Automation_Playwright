// @ts-check
/**
 * Accessibility Tests
 *
 * Validates that key pages and interactive components meet baseline
 * keyboard-navigation and ARIA accessibility requirements.
 *
 * These tests do NOT require the @axe-core/playwright package — they use
 * Playwright's built-in locators to assert that interactive elements have
 * accessible roles, labels, and are keyboard-operable.
 *
 * Run just this file:
 *   npx playwright test accessibility.spec.js --reporter=list
 *
 * Orchestrated by: Test Orchestrator agent
 * BDD coverage gap: "Accessibility (keyboard navigation, screen reader labels)"
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
  { id: 2, name: 'Bob Smith',     email: 'bob@example.com',   position: 'Designer' },
];

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

// ─── Login Page Accessibility ─────────────────────────────────────────────────

test.describe('Accessibility – Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/login');
  });

  test('username input should have an accessible label', async ({ page }) => {
    const input = page.getByLabel('Username', { exact: false });
    await expect(input).toBeVisible();
  });

  test('password input should have an accessible label', async ({ page }) => {
    const input = page.getByLabel('Password', { exact: false });
    await expect(input).toBeVisible();
  });

  test('login button should be reachable via keyboard Tab and activated via Enter', async ({ page }) => {
    await page.getByLabel('Username', { exact: false }).fill('admin');
    await page.keyboard.press('Tab');
    await page.getByLabel('Password', { exact: false }).fill('password');
    await page.keyboard.press('Tab');

    // Login button should now be focused — press Enter to submit
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/list/, { timeout: 8000 });
  });

  test('login form fields should be navigable in logical Tab order', async ({ page }) => {
    // Tab from username → password
    await page.getByLabel('Username', { exact: false }).click();
    await page.keyboard.press('Tab');
    const focusedId = await page.evaluate(() => document.activeElement?.getAttribute('type'));
    expect(focusedId).toBe('password');
  });

  test('dark mode toggle button should be an accessible button', async ({ page }) => {
    // The brightness icon should be wrapped in a button role
    const toggleBtn = page.locator('[data-testid^="Brightness"]').first();
    await expect(toggleBtn).toBeVisible();
    // Its ancestor should be a button
    const btn = toggleBtn.locator('xpath=ancestor-or-self::button').first();
    await expect(btn).toBeVisible();
  });
});

// ─── Employee List Page Accessibility ────────────────────────────────────────

test.describe('Accessibility – Employee List Page', () => {
  test.beforeEach(async ({ page }) => {
    await setLoggedIn(page);
    await mockEmployees(page);
    await page.goto('/list');
    await expect(page.getByRole('cell', { name: 'Alice Johnson' })).toBeVisible({ timeout: 8000 });
  });

  test('Employee List heading should be present and visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Employee List' })).toBeVisible();
  });

  test('"+ Add Employee" button should be a proper button role', async ({ page }) => {
    const btn = page.getByRole('button', { name: /add employee/i });
    await expect(btn).toBeVisible();
  });

  test('search input should have an accessible label', async ({ page }) => {
    const input = page.getByLabel('Search employees', { exact: false });
    await expect(input).toBeVisible();
  });

  test('table should have accessible column headers', async ({ page }) => {
    for (const col of ['ID', 'Name', 'Email', 'Position', 'Actions']) {
      await expect(page.getByRole('columnheader', { name: col })).toBeVisible();
    }
  });

  test('action buttons in table rows should be accessible buttons', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow.getByRole('button', { name: /view/i })).toBeVisible();
    await expect(firstRow.getByRole('button', { name: /edit/i })).toBeVisible();
    await expect(firstRow.getByRole('button', { name: /delete/i })).toBeVisible();
  });

  test('Add Employee button should be keyboard-activatable', async ({ page }) => {
    const btn = page.getByRole('button', { name: /add employee/i });
    await btn.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 4000 });
    await page.keyboard.press('Escape');
  });

  test('dialog should be closed with Escape key', async ({ page }) => {
    await page.getByRole('button', { name: /add employee/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 4000 });
  });
});

// ─── Add Employee Dialog Accessibility ───────────────────────────────────────

test.describe('Accessibility – Add Employee Dialog', () => {
  test.beforeEach(async ({ page }) => {
    await setLoggedIn(page);
    await mockEmployees(page);
    await page.goto('/list');
    await expect(page.getByRole('cell', { name: 'Alice Johnson' })).toBeVisible({ timeout: 8000 });
    await page.getByRole('button', { name: /add employee/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('dialog should have a title element', async ({ page }) => {
    await expect(page.getByRole('dialog').locator('[class*="MuiDialogTitle"]')).toBeVisible();
  });

  test('Name field inside dialog should have an accessible label', async ({ page }) => {
    await expect(page.getByRole('dialog').getByLabel('Name', { exact: false })).toBeVisible();
  });

  test('Email field inside dialog should have an accessible label', async ({ page }) => {
    await expect(page.getByRole('dialog').getByLabel('Email', { exact: false })).toBeVisible();
  });

  test('Position field inside dialog should have an accessible label', async ({ page }) => {
    await expect(page.getByRole('dialog').getByLabel('Position', { exact: false })).toBeVisible();
  });

  test('dialog form fields should be navigable via Tab', async ({ page }) => {
    const dialog = page.getByRole('dialog');
    const nameInput = dialog.getByLabel('Name', { exact: false });
    await nameInput.focus();

    // Tab → Email field
    await page.keyboard.press('Tab');
    const afterFirstTab = await page.evaluate(() => document.activeElement?.getAttribute('type') ?? document.activeElement?.tagName);
    expect(['text', 'input', 'email', 'INPUT']).toContain(afterFirstTab.toUpperCase() === 'INPUT' ? 'INPUT' : afterFirstTab);
  });

  test('submit button in dialog should be accessible', async ({ page }) => {
    await expect(page.getByRole('dialog').getByRole('button', { name: /add employee|save|submit/i })).toBeVisible();
  });
});

// ─── Delete Confirmation Dialog Accessibility ─────────────────────────────────

test.describe('Accessibility – Delete Confirmation Dialog', () => {
  test.beforeEach(async ({ page }) => {
    await setLoggedIn(page);
    await mockEmployees(page);
    await page.goto('/list');
    await expect(page.getByRole('cell', { name: 'Alice Johnson' })).toBeVisible({ timeout: 8000 });
    await page.locator('tbody tr').first().getByRole('button', { name: /delete/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('delete dialog should have "Delete Employee" heading', async ({ page }) => {
    await expect(page.getByRole('dialog').getByRole('heading', { name: 'Delete Employee' })).toBeVisible();
  });

  test('Cancel button in delete dialog should be accessible', async ({ page }) => {
    await expect(page.getByRole('dialog').getByRole('button', { name: /cancel/i })).toBeVisible();
  });

  test('Delete confirm button should be accessible', async ({ page }) => {
    await expect(page.getByRole('dialog').getByRole('button', { name: 'Delete' })).toBeVisible();
  });

  test('Escape key should close the delete dialog', async ({ page }) => {
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 4000 });
  });
});
