// @ts-check
/**
 * API Mocking Tests
 *
 * Uses page.route() to intercept /api/* requests so the UI is tested in
 * isolation — no live backend needed for these scenarios. This lets us
 * exercise error paths and edge cases that are hard to reproduce reliably
 * against a real server.
 */
const { test, expect } = require('@playwright/test');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Set localStorage so the app treats the session as logged in. */
async function setLoggedIn(page, username = 'admin') {
  await page.goto('/login');
  await page.evaluate((u) => {
    localStorage.setItem('loggedIn', 'true');
    localStorage.setItem('username', u);
  }, username);
}

/** Sample employee rows used by several mocked list responses. */
const MOCK_EMPLOYEES = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', position: 'Engineer' },
  { id: 2, name: 'Bob Smith',    email: 'bob@example.com',   position: 'Designer' },
];

// ─── Login API Mocking ────────────────────────────────────────────────────────

test.describe('API Mocking – Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
  });

  test('should show error when login API returns 401', async ({ page }) => {
    await page.route('**/api/login', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Invalid username or password' }),
      })
    );

    await page.getByLabel('Username', { exact: false }).fill('admin');
    await page.getByLabel('Password', { exact: false }).fill('wrongpass');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.locator('text=/invalid/i').first()).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show error when login API returns 500 server error', async ({ page }) => {
    await page.route('**/api/login', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Internal server error' }),
      })
    );

    await page.getByLabel('Username', { exact: false }).fill('admin');
    await page.getByLabel('Password', { exact: false }).fill('password');
    await page.getByRole('button', { name: 'Login' }).click();

    // Any error message should appear and page stays on /login
    await expect(page.locator('[class*="MuiTypography"][style*="color"]').or(
      page.locator('text=/failed|error|invalid/i').first()
    )).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show network error message when login request fails', async ({ page }) => {
    await page.route('**/api/login', (route) => route.abort('failed'));

    await page.getByLabel('Username', { exact: false }).fill('admin');
    await page.getByLabel('Password', { exact: false }).fill('password');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.locator('text=/network|connection|failed/i').first()).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to /list after mocked successful login', async ({ page }) => {
    await page.route('**/api/login', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, user: { username: 'admin' } }),
      })
    );

    await page.getByLabel('Username', { exact: false }).fill('admin');
    await page.getByLabel('Password', { exact: false }).fill('password');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page).toHaveURL(/\/list/, { timeout: 8000 });
  });
});

// ─── Employee List API Mocking ────────────────────────────────────────────────

test.describe('API Mocking – Employee List', () => {
  test.beforeEach(async ({ page }) => {
    await setLoggedIn(page);
  });

  test('should display an empty state when API returns an empty array', async ({ page }) => {
    await page.route('**/api/employees', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
      return route.continue();
    });

    await page.goto('/list');
    await expect(page.getByText('No employees found.')).toBeVisible({ timeout: 6000 });
  });

  test('should display an error alert when GET /api/employees returns 500', async ({ page }) => {
    await page.route('**/api/employees', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Database error' }),
        });
      }
      return route.continue();
    });

    await page.goto('/list');
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 6000 });
    await expect(page.getByRole('alert')).toContainText(/failed|error/i);
  });

  test('should display a network error alert when GET /api/employees request is aborted', async ({ page }) => {
    await page.route('**/api/employees', (route) => {
      if (route.request().method() === 'GET') return route.abort('failed');
      return route.continue();
    });

    await page.goto('/list');
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 6000 });
    await expect(page.getByRole('alert')).toContainText(/network|connection/i);
  });

  test('should render mocked employees correctly in the table', async ({ page }) => {
    await page.route('**/api/employees', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_EMPLOYEES),
        });
      }
      return route.continue();
    });

    await page.goto('/list');

    // Both mock employees should appear
    await expect(page.getByRole('cell', { name: 'Alice Johnson' })).toBeVisible({ timeout: 6000 });
    await expect(page.getByRole('cell', { name: 'Bob Smith' })).toBeVisible();

    // Verify row count
    await expect(page.locator('tbody tr')).toHaveCount(2);
  });
});

// ─── Add Employee API Mocking ─────────────────────────────────────────────────

test.describe('API Mocking – Add Employee', () => {
  test.beforeEach(async ({ page }) => {
    await setLoggedIn(page);
    // Mock GET to return a stable list so Add dialog opens cleanly
    await page.route('**/api/employees', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_EMPLOYEES),
        });
      }
      return route.continue();
    });
    await page.goto('/list');
    await expect(page.getByRole('cell', { name: 'Alice Johnson' })).toBeVisible({ timeout: 6000 });
  });

  test('should show error alert when POST /api/employees returns 400', async ({ page }) => {
    await page.route('**/api/employees', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Email already exists' }),
        });
      }
      return route.continue();
    });

    await page.getByRole('button', { name: /add employee/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByLabel('Name', { exact: false }).fill('Duplicate User');
    await dialog.getByLabel('Email', { exact: false }).fill('alice@example.com');
    await dialog.getByLabel('Position', { exact: false }).fill('Engineer');
    await dialog.getByRole('button', { name: /add employee|save/i }).click();

    await expect(dialog.getByRole('alert')).toContainText(/email|exists|400/i, { timeout: 6000 });
    // Dialog should stay open so user can correct the input
    await expect(dialog).toBeVisible();
  });

  test('should show error alert when POST /api/employees returns 500', async ({ page }) => {
    await page.route('**/api/employees', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      }
      return route.continue();
    });

    await page.getByRole('button', { name: /add employee/i }).click();
    const dialog = page.getByRole('dialog');

    await dialog.getByLabel('Name', { exact: false }).fill('New User');
    await dialog.getByLabel('Email', { exact: false }).fill('new@example.com');
    await dialog.getByLabel('Position', { exact: false }).fill('Manager');
    await dialog.getByRole('button', { name: /add employee|save/i }).click();

    await expect(dialog.getByRole('alert')).toContainText(/failed|error|500/i, { timeout: 6000 });
  });

  test('should show network error when POST /api/employees request is aborted', async ({ page }) => {
    await page.route('**/api/employees', (route) => {
      if (route.request().method() === 'POST') return route.abort('failed');
      return route.continue();
    });

    await page.getByRole('button', { name: /add employee/i }).click();
    const dialog = page.getByRole('dialog');

    await dialog.getByLabel('Name', { exact: false }).fill('Test');
    await dialog.getByLabel('Email', { exact: false }).fill('test@example.com');
    await dialog.getByLabel('Position', { exact: false }).fill('Dev');
    await dialog.getByRole('button', { name: /add employee|save/i }).click();

    await expect(dialog.getByRole('alert')).toContainText(/network|connection/i, { timeout: 6000 });
  });
});

// ─── Slow API / Loading State Mocking ─────────────────────────────────────────

test.describe('API Mocking – Loading States', () => {
  test('should show loading indicator while waiting for employees to load', async ({ page }) => {
    await setLoggedIn(page);

    // Delay the GET response by 1.5 seconds to capture the loading state
    await page.route('**/api/employees', async (route) => {
      if (route.request().method() === 'GET') {
        await new Promise((r) => setTimeout(r, 1500));
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_EMPLOYEES),
        });
      }
      return route.continue();
    });

    await page.goto('/list');

    // Loading state should appear immediately
    await expect(page.getByText(/loading/i)).toBeVisible({ timeout: 3000 });

    // After the delay the real list should appear
    await expect(page.getByRole('cell', { name: 'Alice Johnson' })).toBeVisible({ timeout: 6000 });
  });
});
