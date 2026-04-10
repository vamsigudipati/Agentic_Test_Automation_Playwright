// @ts-check
// ─── Group Activity: BDD Testing Agent ───────────────────────────────────────
// Agent: bdd-tester.agent.md / bdd-tester-skills.agent.md
// Skill:  bdd-scenario-writing.skill.md
//
// Implements the Gherkin scenarios from:
//   bdd/features/employee-management.feature
//
// Each test mirrors a Feature scenario using test.step() for
// Given / When / Then structure — runnable with standard Playwright.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('@playwright/test');

const APP_URL = 'http://localhost:5173';
const uid = () => Date.now();

async function loginAsAdmin(page) {
  await page.goto(`${APP_URL}/login`);
  await page.evaluate(() => {
    localStorage.setItem('loggedIn', 'true');
    localStorage.setItem('username', 'admin');
  });
  await page.goto(`${APP_URL}/list`);
  await expect(page).toHaveURL(/\/list/, { timeout: 8000 });
}

async function createEmployee(page, name, email, position) {
  await page.getByRole('button', { name: /add employee/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByLabel('Name',     { exact: false }).fill(name);
  await page.getByRole('dialog').getByLabel('Email',    { exact: false }).fill(email);
  await page.getByRole('dialog').getByLabel('Position', { exact: false }).fill(position);
  await page.getByRole('dialog').getByRole('button', { name: /add employee|save|submit/i }).click();
  await expect(page.getByText(name)).toBeVisible({ timeout: 8000 });
}

// ─── BDD: View Employees ──────────────────────────────────────────────────────

test('BDD: Employee table shows expected column headers', async ({ page }) => {
  await test.step('Given I am logged in as admin and on the Employee List page', async () => {
    await loginAsAdmin(page);
  });

  await test.step('Then I should see columns: ID, Name, Email, Position, Actions', async () => {
    for (const col of ['ID', 'Name', 'Email', 'Position', 'Actions']) {
      await expect(page.getByRole('columnheader', { name: col })).toBeVisible();
    }
  });
});

// ─── BDD: Search ─────────────────────────────────────────────────────────────

test('BDD: Searching by name filters the employee table', async ({ page }) => {
  const uniqueName = `Searchable BDD ${uid()}`;

  await test.step('Given I am on the Employee List page with at least one employee', async () => {
    await loginAsAdmin(page);
    await createEmployee(page, uniqueName, `bdd${uid()}@test.com`, 'Analyst');
  });

  await test.step('When I type the employee name in the search field', async () => {
    const searchInput = page
      .getByLabel('Search employees', { exact: false })
      .or(page.getByPlaceholder('Search', { exact: false }));
    await searchInput.fill(uniqueName);
  });

  await test.step('Then only that employee should appear in the table', async () => {
    await expect(page.locator('tbody tr')).toHaveCount(1, { timeout: 6000 });
    await expect(page.getByText(uniqueName)).toBeVisible();
  });

  // Cleanup
  const row = page.locator('tbody tr').filter({ hasText: uniqueName });
  await row.getByRole('button', { name: /delete/i }).click();
  const confirmBtn = page.getByRole('button', { name: /confirm|yes|delete/i });
  if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) await confirmBtn.click();
});

// ─── BDD: Add Employee ────────────────────────────────────────────────────────

test('BDD: "+ Add Employee" button opens dialog titled "Add Employee"', async ({ page }) => {
  await test.step('Given I am on the Employee List page', async () => {
    await loginAsAdmin(page);
  });

  await test.step('When I click the "+ Add Employee" button', async () => {
    await page.getByRole('button', { name: /add employee/i }).click();
  });

  await test.step('Then a dialog titled "Add Employee" should appear', async () => {
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog')).toContainText('Add Employee');
  });
});

test('BDD: Pressing Escape closes the dialog without saving', async ({ page }) => {
  await test.step('Given the Add Employee dialog is open', async () => {
    await loginAsAdmin(page);
    await page.getByRole('button', { name: /add employee/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  const rowsBefore = await page.locator('tbody tr').count();

  await test.step('When I press Escape', async () => {
    await page.keyboard.press('Escape');
  });

  await test.step('Then the dialog should close and no new row should be added', async () => {
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 4000 });
    const rowsAfter = await page.locator('tbody tr').count();
    expect(rowsAfter).toBe(rowsBefore);
  });
});

test('BDD: Adding a new employee stores it in the table', async ({ page }) => {
  const name     = `BDD New Employee ${uid()}`;
  const email    = `bddnew${uid()}@test.com`;
  const position = 'Engineer';

  await test.step('Given I am on the Employee List page', async () => {
    await loginAsAdmin(page);
  });

  await test.step('When I fill in the Add Employee form and save', async () => {
    await page.getByRole('button', { name: /add employee/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('dialog').getByLabel('Name',     { exact: false }).fill(name);
    await page.getByRole('dialog').getByLabel('Email',    { exact: false }).fill(email);
    await page.getByRole('dialog').getByLabel('Position', { exact: false }).fill(position);
    await page.getByRole('dialog').getByRole('button', { name: /add employee|save|submit/i }).click();
  });

  await test.step('Then the dialog closes and the employee appears in the table', async () => {
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 6000 });
    await expect(page.getByText(name)).toBeVisible({ timeout: 8000 });
    // Row-count comparison is unreliable when tests run in parallel (other workers
    // may also be adding/removing employees concurrently). Visibility of the
    // new employee's name is a sufficiently strong assertion.
  });
});

test('BDD: Submitting empty Add Employee form keeps dialog open', async ({ page }) => {
  await test.step('Given the Add Employee dialog is open', async () => {
    await loginAsAdmin(page);
    await page.getByRole('button', { name: /add employee/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  await test.step('When I click Save without filling any fields', async () => {
    await page.getByRole('dialog').getByRole('button', { name: /add employee|save|submit/i }).click();
  });

  await test.step('Then the dialog should remain open', async () => {
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});

// ─── BDD: Edit Employee ───────────────────────────────────────────────────────

test('BDD: Edit dialog is pre-filled with existing employee data', async ({ page }) => {
  const name = `BDD Edit ${uid()}`;

  await test.step('Given an employee exists in the system', async () => {
    await loginAsAdmin(page);
    await createEmployee(page, name, `bddedit${uid()}@test.com`, 'Junior Dev');
  });

  await test.step('When I click the Edit action for that employee', async () => {
    const row = page.locator('tbody tr').filter({ hasText: name });
    await row.getByRole('button', { name: /edit/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  await test.step('Then the Name field should be pre-filled with the employee name', async () => {
    await expect(page.getByRole('dialog').getByLabel('Name', { exact: false })).toHaveValue(name);
  });

  // Close dialog
  await page.keyboard.press('Escape');
});

test('BDD: Updating position reflects in the table', async ({ page }) => {
  const name        = `BDD Update ${uid()}`;
  const newPosition = `Senior Eng ${uid()}`;

  await test.step('Given an employee exists in the system', async () => {
    await loginAsAdmin(page);
    await createEmployee(page, name, `bddupd${uid()}@test.com`, 'Junior Dev');
  });

  await test.step('When I update the Position field and save', async () => {
    const row = page.locator('tbody tr').filter({ hasText: name });
    await row.getByRole('button', { name: /edit/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const posField = page.getByRole('dialog').getByLabel('Position', { exact: false });
    await posField.clear();
    await posField.fill(newPosition);
    await page.getByRole('dialog').getByRole('button', { name: /update|save|submit/i }).click();
  });

  await test.step('Then the updated position should appear in the table', async () => {
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 6000 });
    await expect(page.getByText(newPosition)).toBeVisible({ timeout: 8000 });
  });
});

// ─── BDD: Delete Employee ─────────────────────────────────────────────────────

test('BDD: Deleting an employee removes them from the table', async ({ page }) => {
  const name = `BDD Delete ${uid()}`;

  await test.step('Given an employee exists in the system', async () => {
    await loginAsAdmin(page);
    await createEmployee(page, name, `bdddel${uid()}@test.com`, 'Temp');
  });

  await test.step('When I click Delete and confirm', async () => {
    const row = page.locator('tbody tr').filter({ hasText: name });
    await row.getByRole('button', { name: /delete/i }).click();

    const confirmBtn = page.getByRole('button', { name: /confirm|yes|delete/i });
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
    }
  });

  await test.step('Then the employee should no longer appear in the table', async () => {
    await expect(page.getByText(name)).not.toBeVisible({ timeout: 8000 });
  });
});
