// @ts-check
const { expect } = require('@playwright/test');

/**
 * Page Object Model for the Login page (/login)
 */
class LoginPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // Locators
    this.usernameInput = page.getByLabel('Username', { exact: false });
    this.passwordInput = page.getByLabel('Password', { exact: false });
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.errorMessage = page.locator('.MuiTypography-root[class*="colorError"], p[class*="error"], .MuiFormHelperText-root');
  }

  /** Navigate directly to the login page */
  async goto() {
    await this.page.goto('/login');
  }

  /**
   * Fill credentials and submit the login form
   * @param {string} username
   * @param {string} password
   */
  async login(username, password) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /** Returns the text content of the visible error message, or null if none */
  async getErrorText() {
    // MUI renders inline error as a Typography element with color="error"
    const errorEl = this.page.locator('[class*="MuiTypography"][class*="colorError"], [class*="MuiAlert-message"]');
    const count = await errorEl.count();
    if (count === 0) return null;
    return errorEl.first().textContent();
  }
}

module.exports = { LoginPage };
