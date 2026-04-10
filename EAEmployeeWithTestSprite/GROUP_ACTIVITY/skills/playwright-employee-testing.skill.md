---
name: playwright-employee-testing
description: 'Skill for E2E testing the Employee Management app with Playwright MCP. Provides step-by-step instructions for exploring and testing the app at http://localhost:5173.'
---

# Playwright Employee App Testing Skill

This skill guides the Playwright Tester agent through live browser exploration and test generation for the Employee Management application.

## Specific Instructions

1. **Navigate** to `http://localhost:5173` using the Playwright MCP navigate tool.
2. **Check login page** – take a screenshot, identify input selectors for username and password.
3. **Authenticate** – log in with `admin` / `password`, verify redirect to `/list`.
4. **Explore the Employee List page**:
   - Identify the table, its column headers (ID, Name, Email, Position, Actions)
   - Locate the "+ Add Employee" button and the search input
5. **Test Add Employee flow**:
   - Click "+ Add Employee", observe the dialog
   - Fill in name, email, position and submit
   - Verify the new row appears in the table
6. **Test Edit flow** – click Edit on a row, modify a field, save, verify the update
7. **Test Delete flow** – click Delete on a row, verify it is removed
8. **Document locators** found for each interactive element
9. **Generate test cases** for all explored flows using Page Object Model pattern
10. **Close the browser** when exploration is complete
11. **Provide a summary** of: flows tested, selectors found, and proposed spec file contents

## Output Format

Return:
- List of covered user flows
- Key selectors/locators discovered
- Proposed Playwright test code snippets
- Any bugs or unexpected behavior observed
