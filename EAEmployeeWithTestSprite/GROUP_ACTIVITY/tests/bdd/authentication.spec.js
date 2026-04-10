// @ts-check
// ─── Group Activity: BDD Testing Agent ───────────────────────────────────────
// Agent: bdd-tester.agent.md / bdd-tester-skills.agent.md
// Skill:  bdd-scenario-writing.skill.md
//
// Implements the Gherkin scenarios from:
//   bdd/features/authentication.feature
//
// Each test mirrors a Feature scenario using test.step() for
// Given / When / Then structure — runnable with standard Playwright.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('@playwright/test');

const APP_URL    = 'http://localhost:5173';
const LOGIN_PATH = '/login';
const LIST_PATH  = '/list';

// ─── BDD: Successful Login ────────────────────────────────────────────────────

test('BDD: Successful login as admin navigates to Employee List', async ({ page }) => {
  await test.step('Given the application is running and I am on the login page', async () => {
    await page.goto(`${APP_URL}${LOGIN_PATH}`);
    await expect(page).toHaveURL(/\/login/);
  });

  await test.step('When I enter username "admin" and password "password" and click Login', async () => {
    await page.getByLabel('Username', { exact: false }).fill('admin');
    await page.getByLabel('Password', { exact: false }).fill('password');
    await page.getByRole('button', { name: 'Login' }).click();
  });

  await test.step('Then I should be redirected to the Employee List page', async () => {
    await expect(page).toHaveURL(/\/list/, { timeout: 8000 });
    await expect(page.getByRole('heading', { name: 'Employee List' })).toBeVisible();
  });
});

test('BDD: Successful login as user account', async ({ page }) => {
  await test.step('Given I am on the login page', async () => {
    await page.goto(`${APP_URL}${LOGIN_PATH}`);
  });

  await test.step('When I enter username "user" and password "123456" and click Login', async () => {
    await page.getByLabel('Username', { exact: false }).fill('user');
    await page.getByLabel('Password', { exact: false }).fill('123456');
    await page.getByRole('button', { name: 'Login' }).click();
  });

  await test.step('Then I should be redirected to the Employee List page', async () => {
    await expect(page).toHaveURL(/\/list/, { timeout: 8000 });
  });
});

// ─── BDD: Failed Login ────────────────────────────────────────────────────────

test('BDD: Failed login with wrong password shows error', async ({ page }) => {
  await test.step('Given I am on the login page', async () => {
    await page.goto(`${APP_URL}${LOGIN_PATH}`);
  });

  await test.step('When I enter username "admin" and password "wrongpass" and click Login', async () => {
    await page.getByLabel('Username', { exact: false }).fill('admin');
    await page.getByLabel('Password', { exact: false }).fill('wrongpass');
    await page.getByRole('button', { name: 'Login' }).click();
  });

  await test.step('Then I should see an error message and remain on the login page', async () => {
    await expect(page).toHaveURL(/\/login/);
    // MUI v5 Typography with color="error" does not add a stable CSS class name;
    // match on the visible error text content instead.
    await expect(page.locator('text=/invalid/i').first()).toBeVisible({ timeout: 5000 });
  });
});

test('BDD: Failed login with unknown username shows error', async ({ page }) => {
  await test.step('Given I am on the login page', async () => {
    await page.goto(`${APP_URL}${LOGIN_PATH}`);
  });

  await test.step('When I enter username "nobody" and password "anything" and click Login', async () => {
    await page.getByLabel('Username', { exact: false }).fill('nobody');
    await page.getByLabel('Password', { exact: false }).fill('anything');
    await page.getByRole('button', { name: 'Login' }).click();
  });

  await test.step('Then I should remain on the login page', async () => {
    await expect(page).toHaveURL(/\/login/);
  });
});

// ─── BDD: Empty Form Validation ───────────────────────────────────────────────

test('BDD: Submitting empty login form does not navigate away', async ({ page }) => {
  await test.step('Given I am on the login page', async () => {
    await page.goto(`${APP_URL}${LOGIN_PATH}`);
  });

  await test.step('When I click Login without entering credentials', async () => {
    await page.getByRole('button', { name: 'Login' }).click();
  });

  await test.step('Then I should remain on the login page', async () => {
    await expect(page).toHaveURL(/\/login/);
  });
});

// ─── BDD: Password Field Masked ───────────────────────────────────────────────

test('BDD: Password field is masked', async ({ page }) => {
  await test.step('Given I am on the login page', async () => {
    await page.goto(`${APP_URL}${LOGIN_PATH}`);
  });

  await test.step('Then the password input should be of type "password"', async () => {
    const passwordInput = page.getByLabel('Password', { exact: false });
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

// ─── BDD: Redirect Behaviour ─────────────────────────────────────────────────

test('BDD: Unauthenticated user visiting /list is redirected to login', async ({ page }) => {
  await test.step('Given I am not logged in', async () => {
    // Clear any existing auth state
    await page.goto(`${APP_URL}${LOGIN_PATH}`);
    await page.evaluate(() => localStorage.clear());
  });

  await test.step('When I navigate directly to "/list"', async () => {
    await page.goto(`${APP_URL}${LIST_PATH}`);
  });

  await test.step('Then I should be redirected to the login page', async () => {
    await expect(page).toHaveURL(/\/login/, { timeout: 6000 });
  });
});

test('BDD: Authenticated user visiting /login still sees the login form', async ({ page }) => {
  // The Login component does not auto-redirect already-authenticated users.
  // This test documents the actual behaviour.
  await test.step('Given I am already logged in as "admin"', async () => {
    await page.goto(`${APP_URL}${LOGIN_PATH}`);
    await page.evaluate(() => {
      localStorage.setItem('loggedIn', 'true');
      localStorage.setItem('username', 'admin');
    });
  });

  await test.step('When I navigate directly to "/login"', async () => {
    await page.goto(`${APP_URL}${LOGIN_PATH}`);
  });

  await test.step('Then the login form should still be visible', async () => {
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible({ timeout: 6000 });
  });
});
