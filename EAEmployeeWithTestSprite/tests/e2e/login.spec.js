// @ts-check
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('./pages/LoginPage');

test.describe('Login Page', () => {
  /** @type {LoginPage} */
  let loginPage;

  test.beforeEach(async ({ page }) => {
    // Clear any persisted auth state before each test
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  // ─── Happy path ───────────────────────────────────────────────────
  test('should display the login form', async ({ page }) => {
    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('should login successfully with valid credentials (admin/password)', async ({ page }) => {
    await loginPage.login('admin', 'password');
    // After a successful login the app should redirect to /list
    await expect(page).toHaveURL(/\/list/, { timeout: 8000 });
  });

  test('should login successfully with valid credentials (user/123456)', async ({ page }) => {
    await loginPage.login('user', '123456');
    await expect(page).toHaveURL(/\/list/, { timeout: 8000 });
  });

  test('should login successfully with valid credentials (test/test123)', async ({ page }) => {
    await loginPage.login('test', 'test123');
    await expect(page).toHaveURL(/\/list/, { timeout: 8000 });
  });

  // ─── Sad paths ────────────────────────────────────────────────────
  test('should show an error message for invalid username/password', async ({ page }) => {
    await loginPage.login('wronguser', 'wrongpassword');

    // The page should stay on /login
    await expect(page).toHaveURL(/\/login/);

    // An error message should appear on the page
    const errorText = page.locator('text=/invalid|incorrect|failed/i').first();
    await expect(errorText).toBeVisible({ timeout: 6000 });
  });

  test('should show an error for wrong password with valid username', async ({ page }) => {
    await loginPage.login('admin', 'wrongpassword');

    await expect(page).toHaveURL(/\/login/);

    const errorText = page.locator('text=/invalid|incorrect|failed/i').first();
    await expect(errorText).toBeVisible({ timeout: 6000 });
  });

  test('should not submit the form when username is empty (HTML5 validation)', async ({ page }) => {
    // Only fill password — required validation should prevent submission
    await loginPage.passwordInput.fill('password');
    await loginPage.loginButton.click();

    // Still on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should not submit the form when password is empty (HTML5 validation)', async ({ page }) => {
    await loginPage.usernameInput.fill('admin');
    await loginPage.loginButton.click();

    await expect(page).toHaveURL(/\/login/);
  });

  // ─── UI / UX ──────────────────────────────────────────────────────
  test('should mask the password field', async ({ page }) => {
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  });

  test('should show the app title in the navbar', async ({ page }) => {
    await expect(page.getByText('Employee Manager')).toBeVisible();
  });

  test('should redirect unauthenticated users to /login when visiting /', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect unauthenticated users to /login when visiting /list', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.goto('/list');
    await expect(page).toHaveURL(/\/login/);
  });
});
