// @ts-check
// ─── Group Activity: Playwright Testing Agent ─────────────────────────────────
// Agent: playwright-tester.agent.md / playwright-tester-skills.agent.md
// Tests all login-related user flows for the Employee Management app.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('./pages/LoginPage');

const APP_URL = 'http://localhost:5173';

test.describe('Login – Valid Credentials', () => {
  test('admin logs in and reaches the Employee List page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin', 'password');
    await expect(page).toHaveURL(/\/list/, { timeout: 8000 });
    await expect(page.getByRole('heading', { name: 'Employee List' })).toBeVisible();
  });

  test('user (role: user) logs in successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('user', '123456');
    await expect(page).toHaveURL(/\/list/, { timeout: 8000 });
  });

  test('test account logs in successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test', 'test123');
    await expect(page).toHaveURL(/\/list/, { timeout: 8000 });
  });
});

test.describe('Login – Invalid Credentials', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${APP_URL}/login`);
  });

  test('wrong password shows an error message', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login('admin', 'wrongpassword');
    await expect(page).toHaveURL(/\/login/);
    const errorText = await loginPage.getErrorText();
    expect(errorText).toBeTruthy();
  });

  test('unknown username shows an error message', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login('nobody', 'password');
    await expect(page).toHaveURL(/\/login/);
    const errorText = await loginPage.getErrorText();
    expect(errorText).toBeTruthy();
  });

  test('wrong username and wrong password shows an error message', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login('hacker', 'h4ck3r');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Login – Field Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${APP_URL}/login`);
  });

  test('submitting empty form does not navigate away from login', async ({ page }) => {
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('submitting with only username stays on login page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.usernameInput.fill('admin');
    await loginPage.loginButton.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('submitting with only password stays on login page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.passwordInput.fill('password');
    await loginPage.loginButton.click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Login – UI Layout', () => {
  test('login page renders username and password fields and a Login button', async ({ page }) => {
    await page.goto(`${APP_URL}/login`);
    const loginPage = new LoginPage(page);
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('password field input is masked', async ({ page }) => {
    await page.goto(`${APP_URL}/login`);
    const passwordInput = page.getByLabel('Password', { exact: false });
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

test.describe('Login – Redirect Behaviour', () => {
  test('unauthenticated user visiting /list is redirected to login', async ({ page }) => {
    await page.goto(`${APP_URL}/list`);
    await expect(page).toHaveURL(/\/login/, { timeout: 6000 });
  });

  test('authenticated user visiting /login still sees the login page (no forced redirect)', async ({ page }) => {
    // The Login component does not auto-redirect already-authenticated users.
    // This test documents that behaviour: navigating to /login always shows the login form.
    await page.goto(`${APP_URL}/login`);
    await page.evaluate(() => {
      localStorage.setItem('loggedIn', 'true');
      localStorage.setItem('username', 'admin');
    });
    await page.goto(`${APP_URL}/login`);
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible({ timeout: 6000 });
  });
});
