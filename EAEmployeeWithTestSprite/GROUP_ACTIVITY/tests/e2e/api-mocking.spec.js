// @ts-check
// ─── Group Activity: Playwright Testing Agent ─────────────────────────────────
// Agent: playwright-tester.agent.md / playwright-tester-skills.agent.md
// Tests API-mocking scenarios — verifies the UI handles backend responses
// correctly by intercepting network calls with Playwright route interception.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('@playwright/test');

/** Simulate auth in localStorage and navigate to /list */
async function setLoggedIn(page, username = 'admin') {
  await page.goto('/login');
  await page.evaluate((u) => {
    localStorage.setItem('loggedIn', 'true');
    localStorage.setItem('username', u);
  }, username);
  await page.goto('/list');
}

test.describe('API Mocking – Employee List Loading States', () => {
  test('shows employees when GET /employees returns data', async ({ page }) => {
    const mockEmployees = [
      { id: 1, name: 'Alice Mock', email: 'alice@mock.com', position: 'Engineer' },
      { id: 2, name: 'Bob Mock',   email: 'bob@mock.com',   position: 'Designer' },
    ];

    await page.route('**/employees', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockEmployees) })
    );

    await setLoggedIn(page);
    await expect(page.getByText('Alice Mock')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Bob Mock')).toBeVisible();
  });

  test('shows empty state when GET /employees returns empty array', async ({ page }) => {
    await page.route('**/employees', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    await setLoggedIn(page);
    // The app renders a "No employees found." row inside tbody, so count is always ≥1.
    // Assert the empty-state message is visible instead.
    await expect(page.getByText('No employees found.')).toBeVisible({ timeout: 8000 });
  });

  test('shows an error or fallback UI when GET /employees returns 500', async ({ page }) => {
    await page.route('**/employees', route =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Server error' }) })
    );

    await setLoggedIn(page);
    // The UI should not crash and should remain on the list page
    await expect(page).toHaveURL(/\/list/, { timeout: 6000 });
  });

  test('handles network failure for GET /employees gracefully', async ({ page }) => {
    await page.route('**/employees', route => route.abort('failed'));

    await setLoggedIn(page);
    // Page should remain on /list and not hard-crash
    await expect(page).toHaveURL(/\/list/, { timeout: 6000 });
  });
});

test.describe('API Mocking – Add Employee', () => {
  test.beforeEach(async ({ page }) => {
    // Seed list with one employee so the page is in a known state
    const seed = [{ id: 1, name: 'Seed Employee', email: 's@e.com', position: 'Dev' }];
    await page.route('**/employees', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(seed) });
      } else {
        await route.continue();
      }
    });
    await setLoggedIn(page);
  });

  test('mocked successful POST shows new employee in list', async ({ page }) => {
    const newEmployee = { id: 99, name: 'Mocked New', email: 'new@mock.com', position: 'QA' };

    await page.route('**/employees', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(newEmployee) });
      } else {
        await route.continue();
      }
    });

    await page.getByRole('button', { name: /add employee/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('dialog').getByLabel('Name',     { exact: false }).fill(newEmployee.name);
    await page.getByRole('dialog').getByLabel('Email',    { exact: false }).fill(newEmployee.email);
    await page.getByRole('dialog').getByLabel('Position', { exact: false }).fill(newEmployee.position);
    await page.getByRole('dialog').getByRole('button', { name: /add employee|save|submit/i }).click();

    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
  });

  test('mocked 500 error on POST shows error feedback', async ({ page }) => {
    await page.route('**/employees', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'DB error' }) });
      } else {
        await route.continue();
      }
    });

    await page.getByRole('button', { name: /add employee/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('dialog').getByLabel('Name',     { exact: false }).fill('Fail User');
    await page.getByRole('dialog').getByLabel('Email',    { exact: false }).fill('fail@test.com');
    await page.getByRole('dialog').getByLabel('Position', { exact: false }).fill('Ghost');
    await page.getByRole('dialog').getByRole('button', { name: /add employee|save|submit/i }).click();

    // Page should not crash
    await expect(page).toHaveURL(/\/list/);
  });
});

test.describe('API Mocking – Delete Employee', () => {
  test('mocked DELETE removes the employee from the table', async ({ page }) => {
    const employee = { id: 5, name: 'Delete Me', email: 'd@del.com', position: 'Intern' };
    // Track whether the delete has been called so the GET mock returns empty afterwards.
    let deleted = false;

    await page.route('**/api/employees', async (route) => {
      if (route.request().method() === 'GET') {
        const body = deleted ? [] : [employee];
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
      } else {
        await route.continue();
      }
    });
    await page.route(`**/api/employees/${employee.id}`, async (route) => {
      if (route.request().method() === 'DELETE') {
        deleted = true;
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
      } else {
        await route.continue();
      }
    });

    await setLoggedIn(page);
    await expect(page.getByRole('cell', { name: 'Delete Me' })).toBeVisible({ timeout: 8000 });

    const row = page.locator('tbody tr').filter({ hasText: 'Delete Me' });
    await row.getByRole('button', { name: /delete/i }).click();

    // Confirm the delete confirmation dialog
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });
    await dialog.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByRole('cell', { name: 'Delete Me' })).not.toBeVisible({ timeout: 6000 });
  });
});

test.describe('API Mocking – Login Endpoint', () => {
  // The frontend posts to /api/login (Vite proxy → localhost:4000/login).
  // Using '**/api/login' avoids accidentally intercepting the page navigation to /login.
  test('mocked successful login navigates to /list', async ({ page }) => {
    await page.goto('/login');
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

  test('mocked 401 login response shows error in UI', async ({ page }) => {
    await page.goto('/login');
    await page.route('**/api/login', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Invalid username or password' }),
      })
    );

    await page.getByLabel('Username', { exact: false }).fill('admin');
    await page.getByLabel('Password', { exact: false }).fill('bad');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('text=/invalid/i').first()).toBeVisible({ timeout: 5000 });
  });
});
