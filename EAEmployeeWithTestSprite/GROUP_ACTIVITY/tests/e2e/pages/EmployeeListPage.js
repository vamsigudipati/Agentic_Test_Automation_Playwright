// @ts-check

/**
 * Page Object Model – Employee List page (/list)
 * Group Activity Test Suite
 */
class EmployeeListPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    // Toolbar
    this.addEmployeeButton = page.getByRole('button', { name: /add employee/i });
    this.searchInput = page
      .getByLabel('Search employees', { exact: false })
      .or(page.getByPlaceholder('Search', { exact: false }));

    // Table
    this.table     = page.locator('table');
    this.tableRows = page.locator('tbody tr');

    // Dialog
    this.dialog = page.getByRole('dialog');

    // Alerts
    this.successAlert = page.locator('[class*="MuiAlert-standardSuccess"], [class*="MuiAlert-filledSuccess"]');
    this.errorAlert   = page.locator('[class*="MuiAlert-standardError"],   [class*="MuiAlert-filledError"]');
  }

  async goto() {
    await this.page.goto('/list');
  }

  async getRowCount() {
    return this.tableRows.count();
  }

  async clickEditForEmployee(name) {
    const row = this.page.locator('tbody tr').filter({ hasText: name });
    await row.getByRole('button', { name: /edit/i }).click();
  }

  async clickDeleteForEmployee(name) {
    const row = this.page.locator('tbody tr').filter({ hasText: name });
    await row.getByRole('button', { name: /delete/i }).click();
  }

  async fillAddEmployeeForm({ name, email, position }) {
    const dialog = this.page.getByRole('dialog');
    await dialog.getByLabel('Name',     { exact: false }).fill(name);
    await dialog.getByLabel('Email',    { exact: false }).fill(email);
    await dialog.getByLabel('Position', { exact: false }).fill(position);
    await dialog.getByRole('button', { name: /add employee|save|submit/i }).click();
  }

  async fillEditEmployeeForm({ name, email, position }) {
    const dialog = this.page.getByRole('dialog');
    if (name !== undefined) {
      const f = dialog.getByLabel('Name', { exact: false });
      await f.clear(); await f.fill(name);
    }
    if (email !== undefined) {
      const f = dialog.getByLabel('Email', { exact: false });
      await f.clear(); await f.fill(email);
    }
    if (position !== undefined) {
      const f = dialog.getByLabel('Position', { exact: false });
      await f.clear(); await f.fill(position);
    }
    await dialog.getByRole('button', { name: /update|save|submit/i }).click();
  }

  async search(term) {
    await this.searchInput.fill(term);
  }
}

module.exports = { EmployeeListPage };
