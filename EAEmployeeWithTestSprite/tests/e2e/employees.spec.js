// @ts-check
const { test, expect } = require('@playwright/test');
const { EmployeeListPage } = require('./pages/EmployeeListPage');

// ─── Helper: set localStorage to simulate a logged-in session ────────
async function setLoggedIn(page, username = 'admin') {
  await page.goto('/login');
  await page.evaluate((u) => {
    localStorage.setItem('loggedIn', 'true');
    localStorage.setItem('username', u);
  }, username);
  await page.goto('/list');
}

// Unique suffix so parallel/repeated runs don't collide on names
const uid = () => Date.now();

test.describe('Employee List Page', () => {
  /** @type {EmployeeListPage} */
  let listPage;

  test.beforeEach(async ({ page }) => {
    await setLoggedIn(page);
    listPage = new EmployeeListPage(page);
    await expect(page).toHaveURL(/\/list/, { timeout: 8000 });
  });

  // ─── Layout ───────────────────────────────────────────────────────
  test('should display "Employee List" heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Employee List' })).toBeVisible();
  });

  test('should display the "+ Add Employee" button', async ({ page }) => {
    await expect(listPage.addEmployeeButton).toBeVisible();
  });

  test('should display the search field', async ({ page }) => {
    await expect(page.getByLabel('Search employees', { exact: false })).toBeVisible();
  });

  test('should display the employee table with expected columns', async ({ page }) => {
    const headers = ['ID', 'Name', 'Email', 'Position', 'Actions'];
    for (const header of headers) {
      await expect(page.getByRole('columnheader', { name: header })).toBeVisible();
    }
  });
});

test.describe('Employee – Add', () => {
  /** @type {EmployeeListPage} */
  let listPage;

  test.beforeEach(async ({ page }) => {
    await setLoggedIn(page);
    listPage = new EmployeeListPage(page);
  });

  test('should open the Add Employee dialog when the button is clicked', async ({ page }) => {
    await listPage.addEmployeeButton.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog').locator('[class*="MuiDialogTitle"]')).toContainText('Add Employee');
  });

  test('should close the Add Employee dialog when cancelled/closed', async ({ page }) => {
    await listPage.addEmployeeButton.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    // Press Escape to close dialog
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 4000 });
  });

  test('should add a new employee and show it in the list', async ({ page }) => {
    const name = `Test User ${uid()}`;
    const email = `testuser${uid()}@example.com`;
    const position = 'QA Engineer';

    const rowsBefore = await listPage.getRowCount();

    await listPage.addEmployeeButton.click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Name', { exact: false }).fill(name);
    await dialog.getByLabel('Email', { exact: false }).fill(email);
    await dialog.getByLabel('Position', { exact: false }).fill(position);
    await dialog.getByRole('button', { name: /add employee|save/i }).click();

    // Success alert should appear inside the dialog
    await expect(dialog.getByRole('alert')).toContainText(/success/i, { timeout: 6000 });

    // Dialog should close automatically after success
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // New row should be present in the table
    await expect(page.getByRole('cell', { name })).toBeVisible({ timeout: 6000 });

    // Row count should have increased
    const rowsAfter = await listPage.getRowCount();
    expect(rowsAfter).toBeGreaterThan(rowsBefore);
  });

  test('should not add an employee when required fields are missing', async ({ page }) => {
    await listPage.addEmployeeButton.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Try to submit without filling any fields
    await dialog.getByRole('button', { name: /add employee|save/i }).click();

    // Dialog should remain open (HTML5 required validation blocks submission)
    await expect(dialog).toBeVisible();
  });
});

test.describe('Employee – View', () => {
  test.beforeEach(async ({ page }) => {
    await setLoggedIn(page);
    // Ensure there's at least one employee
    const res = await page.request.get('http://localhost:4000/employees');
    const employees = await res.json();
    if (employees.length === 0) {
      await page.request.post('http://localhost:4000/employees', {
        data: { name: 'Seed Employee', email: 'seed@example.com', position: 'Tester' },
      });
      await page.reload();
    }
  });

  test('should open the Employee Details dialog when View is clicked', async ({ page }) => {
    const listPage = new EmployeeListPage(page);

    // Click View on the first row
    const firstViewButton = page.locator('tbody tr').first().getByRole('button', { name: /view/i });
    await firstViewButton.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Employee Details')).toBeVisible();
  });

  test('should display correct employee details in the View dialog', async ({ page }) => {
    // Get first employee name from the table
    const firstNameCell = page.locator('tbody tr').first().locator('td').nth(1);
    const empName = await firstNameCell.textContent();

    // Click view
    await page.locator('tbody tr').first().getByRole('button', { name: /view/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Name should appear in dialog (use first() in case name substring appears in multiple fields)
    await expect(dialog.getByText(empName ?? '').first()).toBeVisible();
  });

  test('should close the View dialog when Close is clicked', async ({ page }) => {
    await page.locator('tbody tr').first().getByRole('button', { name: /view/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /close/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 4000 });
  });
});

test.describe('Employee – Edit', () => {
  /** @type {string} */
  let testEmployeeId;
  /** @type {string} */
  let testEmployeeName;

  test.beforeEach(async ({ page }) => {
    await setLoggedIn(page);

    // Create a dedicated employee for editing
    const name = `Edit Me ${uid()}`;
    const res = await page.request.post('http://localhost:4000/employees', {
      data: { name, email: `editme${uid()}@example.com`, position: 'Temp' },
    });
    const created = await res.json();
    testEmployeeId = String(created.id ?? '');
    testEmployeeName = created.name ?? name;
    await page.reload();
  });

  test('should open the Edit Employee dialog', async ({ page }) => {
    const listPage = new EmployeeListPage(page);
    await listPage.clickEditForEmployee(testEmployeeName);

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('[class*="MuiDialogTitle"]')).toContainText('Edit Employee');
  });

  test('should pre-populate the edit form with current employee values', async ({ page }) => {
    const listPage = new EmployeeListPage(page);
    await listPage.clickEditForEmployee(testEmployeeName);

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByLabel('Name', { exact: false })).toHaveValue(testEmployeeName);
  });

  test('should save edited employee and reflect the change in the list', async ({ page }) => {
    const listPage = new EmployeeListPage(page);
    await listPage.clickEditForEmployee(testEmployeeName);

    const dialog = page.getByRole('dialog');
    const updatedName = `Updated ${uid()}`;
    const nameField = dialog.getByLabel('Name', { exact: false });
    await nameField.clear();
    await nameField.fill(updatedName);

    await dialog.getByRole('button', { name: /update|save/i }).click();

    // Success message
    await expect(dialog.getByRole('alert')).toContainText(/success/i, { timeout: 6000 });

    // Dialog closes
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // Updated name appears in the table
    await expect(page.getByRole('cell', { name: updatedName })).toBeVisible({ timeout: 6000 });
  });
});

test.describe('Employee – Delete', () => {
  /** @type {string} */
  let testEmployeeName;

  test.beforeEach(async ({ page }) => {
    await setLoggedIn(page);

    // Create a dedicated employee to be deleted
    const name = `Delete Me ${uid()}`;
    const res = await page.request.post('http://localhost:4000/employees', {
      data: { name, email: `deleteme${uid()}@example.com`, position: 'Temp' },
    });
    const created = await res.json();
    testEmployeeName = created.name ?? name;
    await page.reload();
  });

  test('should open the Delete confirmation dialog', async ({ page }) => {
    const listPage = new EmployeeListPage(page);
    await listPage.clickDeleteForEmployee(testEmployeeName);

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Delete Employee' })).toBeVisible();
    await expect(dialog.getByText(/are you sure/i)).toBeVisible();
    await expect(dialog.getByText(testEmployeeName)).toBeVisible();
  });

  test('should cancel deletion and keep the employee in the list', async ({ page }) => {
    const listPage = new EmployeeListPage(page);
    await listPage.clickDeleteForEmployee(testEmployeeName);

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /cancel/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 4000 });

    // Employee should still be in the list
    await expect(page.getByRole('cell', { name: testEmployeeName })).toBeVisible();
  });

  test('should delete the employee and remove it from the list', async ({ page }) => {
    const listPage = new EmployeeListPage(page);
    await listPage.clickDeleteForEmployee(testEmployeeName);

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // Click the "Delete" confirm button
    await dialog.getByRole('button', { name: 'Delete' }).click();

    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 6000 });

    // Employee no longer in the list
    await expect(page.getByRole('cell', { name: testEmployeeName })).not.toBeVisible({ timeout: 6000 });
  });
});

test.describe('Employee – Search', () => {
  test.beforeEach(async ({ page }) => {
    await setLoggedIn(page);
    // Seed two employees with distinct names
    await page.request.post('http://localhost:4000/employees', {
      data: { name: `Alice_${uid()}`, email: `alice${uid()}@example.com`, position: 'Designer' },
    });
    await page.request.post('http://localhost:4000/employees', {
      data: { name: `Bob_${uid()}`, email: `bob${uid()}@example.com`, position: 'Developer' },
    });
    await page.reload();
  });

  test('should filter the list when typing in the search box', async ({ page }) => {
    const searchInput = page.getByLabel('Search employees', { exact: false });
    await searchInput.fill('Alice_');

    // All visible rows should contain "Alice_"
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).textContent();
      expect(text?.toLowerCase()).toContain('alice_');
    }
  });

  test('should show "No employees found." when search has no results', async ({ page }) => {
    const searchInput = page.getByLabel('Search employees', { exact: false });
    await searchInput.fill('ZZZNOMATCH99999');
    await expect(page.getByText('No employees found.')).toBeVisible({ timeout: 4000 });
  });

  test('should restore full list when search is cleared', async ({ page }) => {
    const searchInput = page.getByLabel('Search employees', { exact: false });
    // Wait for initial data to load before capturing the row count
    await page.locator('tbody tr').first().waitFor({ timeout: 8000 });
    const initialCount = await page.locator('tbody tr').count();

    await searchInput.fill('Alice_');
    await searchInput.clear();

    // Row count should return to original
    const restoredCount = await page.locator('tbody tr').count();
    expect(restoredCount).toBe(initialCount);
  });
});

test.describe('Authentication Guard', () => {
  test('should redirect to /login when visiting /list without auth', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/list');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to /login when visiting /form without auth', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/form');
    await expect(page).toHaveURL(/\/login/);
  });
});
