// @ts-check
// ─── Group Activity: Playwright Testing Agent ─────────────────────────────────
// Agent: playwright-tester.agent.md / playwright-tester-skills.agent.md
// Skill:  playwright-employee-testing.skill.md
//
// E2E tests for all Employee CRUD flows (Add, Edit, Delete, Search)
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('@playwright/test');
const { EmployeeListPage } = require('./pages/EmployeeListPage');

/** Simulate auth via localStorage and navigate to /list */
async function setLoggedIn(page, username = 'admin') {
  await page.goto('/login');
  await page.evaluate((u) => {
    localStorage.setItem('loggedIn', 'true');
    localStorage.setItem('username', u);
  }, username);
  await page.goto('/list');
}

const uid = () => Date.now();

// ─── Layout ───────────────────────────────────────────────────────────────────
test.describe('Employee List – Layout', () => {
  let listPage;

  test.beforeEach(async ({ page }) => {
    await setLoggedIn(page);
    listPage = new EmployeeListPage(page);
    await expect(page).toHaveURL(/\/list/, { timeout: 8000 });
  });

  test('shows "Employee List" heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Employee List' })).toBeVisible();
  });

  test('shows the "+ Add Employee" button', async () => {
    await expect(listPage.addEmployeeButton).toBeVisible();
  });

  test('shows the search input', async ({ page }) => {
    await expect(
      page.getByLabel('Search employees', { exact: false })
        .or(page.getByPlaceholder('Search', { exact: false }))
    ).toBeVisible();
  });

  test('shows table with expected column headers', async ({ page }) => {
    for (const header of ['ID', 'Name', 'Email', 'Position', 'Actions']) {
      await expect(page.getByRole('columnheader', { name: header })).toBeVisible();
    }
  });
});

// ─── Add Employee ─────────────────────────────────────────────────────────────
test.describe('Employee – Add', () => {
  let listPage;

  test.beforeEach(async ({ page }) => {
    await setLoggedIn(page);
    listPage = new EmployeeListPage(page);
  });

  test('clicking "+ Add Employee" opens the dialog', async ({ page }) => {
    await listPage.addEmployeeButton.click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('dialog title reads "Add Employee"', async ({ page }) => {
    await listPage.addEmployeeButton.click();
    await expect(page.getByRole('dialog')).toContainText('Add Employee');
  });

  test('pressing Escape closes the dialog', async ({ page }) => {
    await listPage.addEmployeeButton.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 4000 });
  });

  test('adds a new employee and the row appears in the table', async ({ page }) => {
    const name     = `E2E User ${uid()}`;
    const email    = `e2e${uid()}@test.com`;
    const position = 'QA Engineer';

    await listPage.addEmployeeButton.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await listPage.fillAddEmployeeForm({ name, email, position });

    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 6000 });
    // Visibility of the new row is a stronger assertion than row-count comparison;
    // count-based checks are unreliable when parallel workers populate the DB
    // concurrently or when the table caps its display at a fixed number of rows.
    await expect(page.getByText(name)).toBeVisible({ timeout: 8000 });
  });

  test('add form validates required fields — empty submit does not close dialog', async ({ page }) => {
    await listPage.addEmployeeButton.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: /add employee|save|submit/i }).click();
    // Dialog should still be visible (form validation blocked submission)
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});

// ─── Edit Employee ────────────────────────────────────────────────────────────
test.describe('Employee – Edit', () => {
  const employeeName = `Edit Target ${uid()}`;
  const employeeEmail    = `edit${uid()}@test.com`;
  const employeePosition = 'Junior Dev';

  // Create a fresh employee before the describe group
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await setLoggedIn(page);
    const listPage = new EmployeeListPage(page);
    await listPage.addEmployeeButton.click();
    await listPage.fillAddEmployeeForm({
      name: employeeName, email: employeeEmail, position: employeePosition,
    });
    await expect(page.getByText(employeeName)).toBeVisible({ timeout: 8000 });
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await setLoggedIn(page);
    await expect(page).toHaveURL(/\/list/, { timeout: 8000 });
  });

  test('clicking Edit opens the dialog pre-filled with existing data', async ({ page }) => {
    const listPage = new EmployeeListPage(page);
    await listPage.clickEditForEmployee(employeeName);
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog').getByLabel('Name', { exact: false })).toHaveValue(employeeName);
  });

  test('updating the Position field reflects in the table', async ({ page }) => {
    const listPage    = new EmployeeListPage(page);
    const newPosition = `Senior Dev ${uid()}`;

    await listPage.clickEditForEmployee(employeeName);
    await expect(page.getByRole('dialog')).toBeVisible();
    await listPage.fillEditEmployeeForm({ position: newPosition });

    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 6000 });
    await expect(page.getByText(newPosition)).toBeVisible({ timeout: 8000 });
  });

  test('updating Name reflects in the table', async ({ page }) => {
    const listPage = new EmployeeListPage(page);
    const newName  = `Renamed User ${uid()}`;

    const row = page.locator('tbody tr').filter({ hasText: employeeName }).or(
      page.locator('tbody tr').filter({ hasText: 'Edit Target' })
    );
    await row.first().getByRole('button', { name: /edit/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const nameField = page.getByRole('dialog').getByLabel('Name', { exact: false });
    await nameField.clear();
    await nameField.fill(newName);
    await page.getByRole('dialog').getByRole('button', { name: /update|save|submit/i }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 6000 });
    await expect(page.getByText(newName)).toBeVisible({ timeout: 8000 });
  });
});

// ─── Delete Employee ──────────────────────────────────────────────────────────
test.describe('Employee – Delete', () => {
  test.beforeEach(async ({ page }) => {
    await setLoggedIn(page);
    await expect(page).toHaveURL(/\/list/, { timeout: 8000 });
  });

  test('deleting a freshly created employee removes it from the table', async ({ page }) => {
    const listPage = new EmployeeListPage(page);
    const name     = `Delete Me ${uid()}`;

    // Create
    await listPage.addEmployeeButton.click();
    await listPage.fillAddEmployeeForm({ name, email: `del${uid()}@test.com`, position: 'Temp' });
    await expect(page.getByText(name)).toBeVisible({ timeout: 8000 });

    // Delete
    await listPage.clickDeleteForEmployee(name);

    // Confirm deletion — scope to the dialog to avoid matching the table's Delete button
    const dialog = page.getByRole('dialog');
    if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dialog.getByRole('button', { name: /delete/i }).click();
      await expect(dialog).not.toBeVisible({ timeout: 6000 });
    }

    // Scope assertion to tbody to avoid strict-mode violation when the dialog
    // briefly shows the employee name while closing.
    await expect(page.locator('tbody').getByText(name)).not.toBeVisible({ timeout: 8000 });
  });
});

// ─── Search / Filter ──────────────────────────────────────────────────────────
test.describe('Employee – Search', () => {
  test.beforeEach(async ({ page }) => {
    await setLoggedIn(page);
    await expect(page).toHaveURL(/\/list/, { timeout: 8000 });
  });

  test('search filters table to only show matching rows', async ({ page }) => {
    const listPage   = new EmployeeListPage(page);
    const uniqueName = `Searchable ${uid()}`;

    // Create a uniquely named employee
    await listPage.addEmployeeButton.click();
    await listPage.fillAddEmployeeForm({
      name: uniqueName, email: `srch${uid()}@test.com`, position: 'Analyst',
    });
    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 8000 });

    // Type the unique name into the search box
    await listPage.search(uniqueName);

    // Only one row should be visible
    await expect(listPage.tableRows).toHaveCount(1, { timeout: 6000 });
    await expect(page.getByText(uniqueName)).toBeVisible();

    // Cleanup
    await listPage.clickDeleteForEmployee(uniqueName);
    const confirmBtn = page.getByRole('button', { name: /confirm|yes|delete/i });
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
    }
  });

  test('clearing search restores the full list', async ({ page }) => {
    const listPage   = new EmployeeListPage(page);
    const uniqueName = `ClearSearch-${uid()}`;

    // Seed a known employee so the list is never empty during this test
    await listPage.addEmployeeButton.click();
    await listPage.fillAddEmployeeForm({
      name: uniqueName, email: `clr${uid()}@test.com`, position: 'Tester',
    });
    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 8000 });

    const totalBefore = await listPage.getRowCount();

    // Search for something that won't match anything
    await listPage.search('zzznomatch999');
    // The app renders a "No employees found." row inside tbody — check for that text
    // rather than expecting zero <tr> elements (which would be 1 with the message row).
    await expect(page.getByText('No employees found.')).toBeVisible({ timeout: 5000 });

    // Clear the search — full list should be restored
    await listPage.search('');
    await expect(listPage.tableRows).toHaveCount(totalBefore, { timeout: 5000 });

    // Cleanup
    await listPage.clickDeleteForEmployee(uniqueName);
    const confirmBtn = page.getByRole('button', { name: /confirm|yes|delete/i });
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
    }
  });
});
