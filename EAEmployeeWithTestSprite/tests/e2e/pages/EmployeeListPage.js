// @ts-check
const { expect } = require('@playwright/test');

/**
 * Page Object Model for the Employee List page (/list)
 */
class EmployeeListPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // Toolbar
    this.searchInput = page.getByLabel('Search employees', { exact: false }).or(
      page.getByPlaceholder('Search', { exact: false })
    );
    this.addEmployeeButton = page.getByRole('button', { name: /add employee/i });

    // Table
    this.table = page.locator('table');
    this.tableRows = page.locator('tbody tr');

    // Dialogs
    this.dialog = page.getByRole('dialog');
    this.dialogTitle = page.getByRole('dialog').locator('[class*="MuiDialogTitle"]');

    // Snackbar / success alerts
    this.successAlert = page.locator('[class*="MuiAlert-standardSuccess"], [class*="MuiAlert-filledSuccess"]');
    this.errorAlert = page.locator('[class*="MuiAlert-standardError"], [class*="MuiAlert-filledError"]');
  }

  /** Navigate directly to the list page (requires auth cookie / localStorage) */
  async goto() {
    await this.page.goto('/list');
  }

  /** Returns the number of data rows currently visible in the table */
  async getRowCount() {
    return this.tableRows.count();
  }

  /**
   * Click the "View" button on the row matching the given employee name
   * @param {string} name
   */
  async clickViewForEmployee(name) {
    const row = this.page.locator('tbody tr').filter({ hasText: name });
    await row.getByRole('button', { name: /view/i }).click();
  }

  /**
   * Click the "Edit" button on the row matching the given employee name
   * @param {string} name
   */
  async clickEditForEmployee(name) {
    const row = this.page.locator('tbody tr').filter({ hasText: name });
    await row.getByRole('button', { name: /edit/i }).click();
  }

  /**
   * Click the "Delete" button on the row matching the given employee name
   * @param {string} name
   */
  async clickDeleteForEmployee(name) {
    const row = this.page.locator('tbody tr').filter({ hasText: name });
    await row.getByRole('button', { name: /delete/i }).click();
  }

  /** Confirm the delete dialog */
  async confirmDelete() {
    await this.page.getByRole('button', { name: /confirm|yes|delete/i }).click();
  }

  /**
   * Fill and submit the Add Employee form inside a dialog
   * @param {{ name: string, email: string, position: string }} employee
   */
  async fillAddEmployeeForm({ name, email, position }) {
    const dialog = this.page.getByRole('dialog');
    await dialog.getByLabel('Name', { exact: false }).fill(name);
    await dialog.getByLabel('Email', { exact: false }).fill(email);
    await dialog.getByLabel('Position', { exact: false }).fill(position);
    await dialog.getByRole('button', { name: /add employee|save|submit/i }).click();
  }

  /**
   * Fill and submit the Edit Employee form inside a dialog
   * @param {{ name?: string, email?: string, position?: string }} updates
   */
  async fillEditEmployeeForm(updates) {
    const dialog = this.page.getByRole('dialog');
    if (updates.name !== undefined) {
      const nameField = dialog.getByLabel('Name', { exact: false });
      await nameField.clear();
      await nameField.fill(updates.name);
    }
    if (updates.email !== undefined) {
      const emailField = dialog.getByLabel('Email', { exact: false });
      await emailField.clear();
      await emailField.fill(updates.email);
    }
    if (updates.position !== undefined) {
      const positionField = dialog.getByLabel('Position', { exact: false });
      await positionField.clear();
      await positionField.fill(updates.position);
    }
    await dialog.getByRole('button', { name: /update|save|submit/i }).click();
  }

  /** Search for a term using the search input */
  async search(term) {
    // Try finding input by placeholder or type
    const searchInput = this.page.getByPlaceholder(/search/i).or(
      this.page.locator('input[type="text"]').first()
    );
    await searchInput.fill(term);
  }
}

module.exports = { EmployeeListPage };
