// @ts-check
const { expect } = require('@playwright/test');

/**
 * Page Object Model for the Add/Edit Employee dialog form.
 *
 * Encapsulates all interactions with the employee dialog that appears
 * when adding a new employee or editing an existing one.
 */
class EmployeeFormPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // The MUI dialog element
    this.dialog = page.getByRole('dialog');

    // Form fields (resolved inside the dialog for safety)
    this.nameInput     = this.dialog.getByLabel('Name',     { exact: false });
    this.emailInput    = this.dialog.getByLabel('Email',    { exact: false });
    this.positionInput = this.dialog.getByLabel('Position', { exact: false });

    // Buttons inside the dialog
    this.submitButton = this.dialog.getByRole('button', { name: /add employee|save|update|submit/i });
    this.cancelButton = this.dialog.getByRole('button', { name: /cancel|close/i });

    // Alerts inside the dialog
    this.successAlert = this.dialog.getByRole('alert').filter({ hasText: /success/i });
    this.errorAlert   = this.dialog.getByRole('alert').filter({ hasText: /error|failed|required/i });
  }

  // ─── Assertions ────────────────────────────────────────────────────────────

  /** Wait for the dialog to be visible */
  async expectVisible() {
    await expect(this.dialog).toBeVisible();
  }

  /** Wait for the dialog to be hidden */
  async expectHidden(timeout = 5000) {
    await expect(this.dialog).not.toBeVisible({ timeout });
  }

  /**
   * Assert the dialog title contains `text`
   * @param {string|RegExp} text
   */
  async expectTitle(text) {
    await expect(this.dialog.locator('[class*="MuiDialogTitle"]')).toContainText(text);
  }

  // ─── Form interactions ─────────────────────────────────────────────────────

  /**
   * Fill all three employee fields.
   * @param {{ name: string, email: string, position: string }} data
   */
  async fill({ name, email, position }) {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.positionInput.fill(position);
  }

  /**
   * Clear a field and type a new value.
   * @param {'name'|'email'|'position'} field
   * @param {string} value
   */
  async updateField(field, value) {
    const input = {
      name:     this.nameInput,
      email:    this.emailInput,
      position: this.positionInput,
    }[field];
    await input.clear();
    await input.fill(value);
  }

  /**
   * Get the current value of a form field.
   * @param {'name'|'email'|'position'} field
   * @returns {Promise<string>}
   */
  async getFieldValue(field) {
    const input = {
      name:     this.nameInput,
      email:    this.emailInput,
      position: this.positionInput,
    }[field];
    return input.inputValue();
  }

  /** Submit the form */
  async submit() {
    await this.submitButton.click();
  }

  /** Cancel / close the dialog */
  async cancel() {
    await this.cancelButton.click();
  }

  // ─── Combined helpers ──────────────────────────────────────────────────────

  /**
   * Fill all fields and submit the form. Waits for the success alert.
   * @param {{ name: string, email: string, position: string }} data
   */
  async fillAndSubmit(data) {
    await this.fill(data);
    await this.submit();
  }

  /**
   * Assert all three fields have expected values (useful after opening Edit dialog).
   * @param {{ name?: string, email?: string, position?: string }} expected
   */
  async expectFieldValues({ name, email, position } = {}) {
    if (name     !== undefined) await expect(this.nameInput).toHaveValue(name);
    if (email    !== undefined) await expect(this.emailInput).toHaveValue(email);
    if (position !== undefined) await expect(this.positionInput).toHaveValue(position);
  }
}

module.exports = { EmployeeFormPage };
