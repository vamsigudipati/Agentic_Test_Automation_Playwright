// @ts-check
const { expect } = require('@playwright/test');

/**
 * Page Object Model – Login page (/login)
 * Group Activity Test Suite
 */
class LoginPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.usernameInput = page.getByLabel('Username', { exact: false });
    this.passwordInput = page.getByLabel('Password', { exact: false });
    this.loginButton    = page.getByRole('button', { name: 'Login' });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(username, password) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async getErrorText() {
    // MUI v5 Typography with color="error" does not add a stable class name.
    // Match on visible text content that appears after a failed login attempt.
    const errorEl = this.page.locator('text=/invalid|incorrect|failed|error|network/i').first();
    try {
      await errorEl.waitFor({ state: 'visible', timeout: 5000 });
      return errorEl.textContent();
    } catch {
      return null;
    }
  }
}

module.exports = { LoginPage };
