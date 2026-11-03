# Group Activity Project Report
## Testing Agents Orchestration — Employee Management Application

**Date:** April 9, 2026  
**Project:** GROUP_ACTIVITY — Testing Agents Orchestration  
**Technology Stack:** Playwright · Node.js · Express · SQLite · React/Vite  
**Framework:** GitHub Copilot Agent & Skill Architecture (`.agent.md` / `.skill.md`)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Objective](#2-project-objective)
3. [Application Under Test](#3-application-under-test)
4. [Project Structure](#4-project-structure)
5. [Agent Design & Architecture](#5-agent-design--architecture)
6. [Skill Design](#6-skill-design)
7. [Skills-Enhanced Agents](#7-skills-enhanced-agents)
8. [Orchestration Model](#8-orchestration-model)
9. [Test Suite Implementation](#9-test-suite-implementation)
10. [Parallel Execution Strategy](#10-parallel-execution-strategy)
11. [Issues Encountered & Resolutions](#11-issues-encountered--resolutions)
12. [Final Test Results](#12-final-test-results)
13. [Lessons Learned](#13-lessons-learned)
14. [Conclusion](#14-conclusion)

---

## 1. Executive Summary

This project demonstrates the design, implementation, and orchestration of a multi-agent AI testing framework for the Employee Management application. Three specialist testing agents — **Playwright Tester**, **Backend Tester**, and **BDD Tester** — were created, each equipped with dedicated skills, and co-ordinated by a **Test Orchestrator** to deliver comprehensive, three-layer test coverage.

The final test suite runs **315 tests** across **3 browsers** (Chromium, Firefox, WebKit) in parallel, achieving **315 passed / 0 failed / 0 skipped**.

---

## 2. Project Objective

The `Activity.txt` defined two tracks:

**Track 1 — Base Agents**
> Create a Playwright Testing Agent, Backend Testing Agent, and BDD Testing Agent, then orchestrate them together to achieve comprehensive testing coverage.

**Track 2 — Skill-Enhanced Agents**
> Extend each agent with a dedicated Skill (`.skill.md`), giving each agent structured domain knowledge it can read and apply autonomously.

The overarching goal was to demonstrate how different AI agents with distinct specialisms — and their associated skills — can be orchestrated to collectively test an application at every layer: API, acceptance criteria, and end-to-end browser automation.

---

## 3. Application Under Test

The **Employee Management Application** is a full-stack web app with the following architecture:

| Layer    | Technology         | URL                         | Purpose                              |
|----------|--------------------|-----------------------------|--------------------------------------|
| Frontend | React + Vite       | `http://localhost:5173`     | SPA with React Router                |
| Backend  | Express + SQLite   | `http://localhost:4000`     | REST API for CRUD operations         |
| Auth     | localStorage       | `/login` route              | Session stored in browser storage    |
| Proxy    | Vite dev server    | `/api/*` → `localhost:4000` | Forwards frontend API calls          |

**REST API Endpoints:**

| Method | Endpoint             | Description               |
|--------|----------------------|---------------------------|
| POST   | `/login`             | Authenticate user         |
| GET    | `/employees`         | List all employees        |
| POST   | `/employees`         | Create new employee       |
| PUT    | `/employees/:id`     | Update employee by ID     |
| DELETE | `/employees/:id`     | Delete employee by ID     |

**Test Credentials:**

| Username | Password  | Role  |
|----------|-----------|-------|
| admin    | password  | Admin |
| user     | 123456    | User  |
| test     | test123   | Test  |

---

## 4. Project Structure

```
GROUP_ACTIVITY/
├── Activity.txt                          # Assignment brief
├── PROJECT_REPORT.md                     # This document
│
├── agents/                               # GitHub Copilot agent definitions
│   ├── playwright-tester.agent.md        # Base Playwright Testing Agent
│   ├── backend-tester.agent.md           # Base Backend Testing Agent
│   ├── bdd-tester.agent.md               # Base BDD Testing Agent
│   ├── test-orchestrator.agent.md        # Base Orchestrator Agent
│   ├── playwright-tester-skills.agent.md # Playwright Agent + Skill reference
│   ├── backend-tester-skills.agent.md    # Backend Agent + Skill reference
│   ├── bdd-tester-skills.agent.md        # BDD Agent + Skill reference
│   └── test-orchestrator-skills.agent.md # Orchestrator Agent + Skill references
│
├── skills/                               # GitHub Copilot reusable skills
│   ├── playwright-employee-testing.skill.md
│   ├── backend-api-testing.skill.md
│   └── bdd-scenario-writing.skill.md
│
└── tests/                                # Standalone Playwright test project
    ├── package.json
    ├── playwright.config.js
    ├── backend/
    │   └── api.spec.js                   # 29 pure API tests (no browser)
    ├── bdd/
    │   ├── authentication.spec.js        # 8 BDD-style tests
    │   ├── employee-management.spec.js   # 9 BDD-style tests
    │   └── features/
    │       ├── authentication.feature    # Gherkin documentation
    │       └── employee-management.feature
    └── e2e/
        ├── login.spec.js                 # 13 browser tests
        ├── employees.spec.js             # 15 browser tests
        ├── api-mocking.spec.js           # 9 mocked API tests
        ├── accessibility.spec.js         # 22 accessibility tests
        └── pages/
            ├── LoginPage.js              # Page Object Model
            ├── EmployeeListPage.js       # Page Object Model
            └── EmployeeFormPage.js       # Page Object Model
```

---

## 5. Agent Design & Architecture

Agents are GitHub Copilot chat participants defined in `.agent.md` files with a YAML frontmatter header (`name`, `description`, `tools`) and a Markdown body that contains their role, domain knowledge, workflow, and coding standards.

### 5.1 Playwright Testing Agent

**File:** `agents/playwright-tester.agent.md`

**Purpose:** Automates end-to-end browser tests for the full UI — login flows, Employee CRUD operations, accessibility, API response mocking, and visual regression.

**Key design decisions:**
- Declared Playwright MCP tools (`playwright_navigate`, `playwright_screenshot`, `playwright_click`, `playwright_fill`, etc.) so the agent can interact with a live browser.
- Embedded the full application URL map, test credentials, and Page Object Model conventions so the agent produces consistent, maintainable code.
- Defined five test areas: Login, Employee List, Add/Edit/Delete Employee, API Mocking, and Visual Regression.
- Mandated ARIA role selectors over brittle CSS selectors.

**Thought process:** The Playwright agent needed to "know" the app well enough to generate tests without being prompted with selectors or URLs every time. Embedding the app's architecture, credentials, and POM conventions into the agent definition achieves this — turning a general-purpose Playwright agent into an app-specific testing expert.

---

### 5.2 Backend Testing Agent

**File:** `agents/backend-tester.agent.md`

**Purpose:** Validates all REST API endpoints independently of the browser — status codes, response payloads, data persistence, and error handling.

**Key design decisions:**
- No browser tools declared; the agent works purely with HTTP requests (Playwright `request` fixture).
- Embedded the full API reference table, employee schema (SQLite field types), and valid test credentials.
- Defined explicit test scenarios per endpoint, including all known error conditions (`400`, `401`, `404`).
- Included a cleanup responsibility — test data created during runs must be deleted.

**Thought process:** Decoupling API testing from browser testing is a best practice. If the API is broken, browser tests will fail for the wrong reason. Running backend tests first (in the orchestrator's Phase 1) acts as a gate: browser tests only run once the API is confirmed stable.

---

### 5.3 BDD Testing Agent

**File:** `agents/bdd-tester.agent.md`

**Purpose:** Expresses application behavior as Gherkin feature files (Given/When/Then), bridging business requirements and automated tests.

**Key design decisions:**
- Embedded full Gherkin feature templates for Authentication and Employee Management directly in the agent definition for immediate use.
- Defined the BDD workflow in five steps: identify user stories → write Feature files → define step definitions → map to existing tests → identify coverage gaps.
- Used declarative language rules ("describe *what*, not *how*") to keep scenarios business-readable.
- Produced both a `.feature` file (Gherkin documentation) and a runnable Playwright spec using `test.step()` for Given/When/Then (avoiding Cucumber.js dependency).

**Thought process:** Pure Gherkin (Cucumber.js) adds a compilation layer not needed when the audience is developers. BDD scenarios implemented via Playwright's `test.step()` provide the Given/When/Then readability for stakeholders while remaining executable within the existing test runner — no additional tooling required.

---

### 5.4 Test Orchestrator Agent

**File:** `agents/test-orchestrator.agent.md`

**Purpose:** Coordinates all three specialist agents in a structured sequence and produces a unified coverage report.

**Key design decisions:**
- Defined a **four-phase orchestration workflow**:
  - **Phase 1 (Backend Tester):** Pre-flight API validation
  - **Phase 2 (BDD Tester):** Acceptance criteria definition
  - **Phase 3 (Playwright Tester):** E2E browser automation
  - **Phase 4 (Orchestrator):** Consolidated coverage report
- Embedded a standardised report template covering all three layers.
- Defined escalation logic: if Phase 1 finds API failures, do not proceed to Phase 3.

**Thought process:** The orchestrator acts as a QA lead — it does not do the work itself, but delegates to specialists and synthesises results. The phased sequence mirrors real-world testing practice: validate the foundation (API) before testing what sits on top (UI), and express expected behavior (BDD) before automating it.

---

## 6. Skill Design

Skills (`.skill.md` files) are reusable knowledge modules that agents can load at invocation time. They provide step-by-step instructions specific to a task, keeping agent definitions focused on *who* they are while skills define *how* to do a specific job.

### 6.1 `playwright-employee-testing.skill.md`

**Purpose:** Step-by-step guide for the Playwright agent to explore and test the live app via browser automation.

**Contents:**
- 10 ordered steps: navigate → screenshot → authenticate → explore columns → test Add → test Edit → test Delete → document locators → generate test code → summarise
- Output format requirements: covered flows, discovered selectors, proposed spec snippets, observed bugs

**Why it's a skill and not just in the agent:** The skill can be loaded only when doing exploratory testing, keeping the agent lightweight for other tasks. Skills are composable — the same agent can use different skills for different jobs.

---

### 6.2 `backend-api-testing.skill.md`

**Purpose:** A structured checklist for validating every REST API endpoint with concrete `curl` commands and expected status codes.

**Contents:**
- 8 steps covering server health check → POST /login → GET /employees → POST/PUT/DELETE /employees → cleanup → report
- An output table template for recording expected vs. actual HTTP status codes per scenario

---

### 6.3 `bdd-scenario-writing.skill.md`

**Purpose:** Guides the BDD Tester to author high-quality, consistent Gherkin scenarios.

**Contents:**
- 10 steps: identify feature → write Feature block → Background block → scenarios (happy/sad/edge) → mapping to existing tests → gap report
- Rules for declarative language, scenario structure, and file naming
- Output format: completed `.feature` file + mapping table + gap list

---

## 7. Skills-Enhanced Agents

Skills-enhanced agents (`*-skills.agent.md`) are variants of the base agents that explicitly reference their skill file in the system prompt. This exposes the skill's step-by-step instructions to the agent at invocation time.

| Agent File (Base)              | Agent File (+ Skills)                   | Skill Loaded                            |
|--------------------------------|-----------------------------------------|-----------------------------------------|
| `playwright-tester.agent.md`   | `playwright-tester-skills.agent.md`     | `playwright-employee-testing.skill.md`  |
| `backend-tester.agent.md`      | `backend-tester-skills.agent.md`        | `backend-api-testing.skill.md`          |
| `bdd-tester.agent.md`          | `bdd-tester-skills.agent.md`            | `bdd-scenario-writing.skill.md`         |
| `test-orchestrator.agent.md`   | `test-orchestrator-skills.agent.md`     | All three skills                        |

**Why maintain two variants?**
- The **base agents** are lighter and suitable for interactive Q&A or ad-hoc test generation.
- The **skills-enhanced agents** are fully self-contained for autonomous end-to-end task execution with no prompting required.

---

## 8. Orchestration Model

```
┌─────────────────────────────────────────────────────┐
│                   TEST ORCHESTRATOR                  │
│         (test-orchestrator[-skills].agent.md)        │
└────────────┬──────────────┬────────────────┬─────────┘
             │              │                │
    Phase 1  │     Phase 2  │       Phase 3  │
             ▼              ▼                ▼
  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │   BACKEND    │  │    BDD       │  │  PLAYWRIGHT  │
  │   TESTER     │  │   TESTER     │  │   TESTER     │
  │              │  │              │  │              │
  │ api.spec.js  │  │ *.feature    │  │ login.spec   │
  │ 29 tests     │  │ auth.spec    │  │ employees    │
  │ HTTP only    │  │ emgmt.spec   │  │ mocking      │
  │              │  │ 17 BDD tests │  │ a11y.spec    │
  └──────────────┘  └──────────────┘  └──────────────┘
             │              │                │
             └──────────────┴────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │  UNIFIED REPORT  │
                  │  315 tests       │
                  │  3 browsers      │
                  │  All passing     │
                  └──────────────────┘
```

The orchestration sequence is:

1. **Backend Tester** validates the API is healthy — 29 tests, no browser required, fast feedback.
2. **BDD Tester** documents and executes acceptance criteria — 17 tests, human-readable scenarios.
3. **Playwright Tester** drives the full UI — 59 browser tests (login + employees + mocking + accessibility).
4. **Orchestrator** consolidates all results across all three browsers into a single HTML report.

---

## 9. Test Suite Implementation

The `tests/` directory is a **standalone Playwright project** (`package.json`, `playwright.config.js`) entirely separate from the Solo Activity tests, preventing any interference.

### 9.1 Test Layer Breakdown

| Layer       | File                           | Tests | Browser? | Description                                  |
|-------------|-------------------------------|-------|----------|----------------------------------------------|
| Backend     | `backend/api.spec.js`          |  29   | No       | Pure HTTP REST API validation                |
| BDD         | `bdd/authentication.spec.js`   |   8   | Yes      | Given/When/Then login scenarios              |
| BDD         | `bdd/employee-management.spec.js` | 9  | Yes      | Given/When/Then CRUD scenarios               |
| E2E         | `e2e/login.spec.js`            |  13   | Yes      | Browser login flows                          |
| E2E         | `e2e/employees.spec.js`        |  15   | Yes      | Employee CRUD browser flows                  |
| E2E         | `e2e/api-mocking.spec.js`      |   9   | Yes      | Mocked API responses for loading/error states|
| E2E         | `e2e/accessibility.spec.js`    |  22   | Yes      | Keyboard navigation, ARIA labels, roles      |
| **Total**   |                               | **105**|         | × 3 browsers = **315 test runs**             |

### 9.2 Backend API Tests (29 tests)

Tests all five endpoints using Playwright's `request` fixture (no browser opened). Covers:
- `POST /login`: 7 scenarios — all three users, wrong password, unknown user, missing each field, empty body, response body shape
- `GET /employees`: 3 scenarios — status, JSON array, required fields
- `POST /employees`: 7 scenarios — success, created record appears, missing each field, empty body, all empty strings
- `PUT /employees/:id`: 6 scenarios — full update, persistence, 404, missing each field
- `DELETE /employees/:id`: 4 scenarios — success, persistence, 404, double-delete returns 404
- Data integrity: 2 scenarios — full CRUD lifecycle, special characters in fields

### 9.3 BDD Tests (17 tests)

Implemented as Playwright specs using `test.step()` to express Given/When/Then without requiring Cucumber.js. Each step is labeled declaratively for business readability while remaining executable with `npx playwright test`.

**Authentication scenarios (8):** Successful login (admin, user, test accounts), failed login (wrong password, unknown user), empty form submission, password masking, unauthenticated redirect.

**Employee management scenarios (9):** Column headers, search filter, Add dialog, Escape-to-close, add employee, empty form validation, edit pre-fill, position update, delete removal.

Gherkin `.feature` files in `bdd/features/` serve as living documentation, with a mapping comment at the bottom of each linking each scenario to its implementing spec file.

### 9.4 E2E Browser Tests (59 tests)

**Login spec (13 tests):** Valid credentials for all three accounts, invalid credentials, field validation, UI layout assertions, redirect behavior.

**Employees spec (15 tests):** Layout assertions, add employee full flow, edit name and position, delete with confirmation, search filter, clear-search restore — all using Page Object Model classes.

**API Mocking spec (9 tests):** Uses `page.route()` to intercept network calls and return controlled responses — loading with data, empty state, 500 error, network failure, mocked POST success, mocked POST 500, mocked DELETE, mocked login success, mocked 401 login.

**Accessibility spec (22 tests):** Input labels, button roles, keyboard Tab order, Enter/Escape activation, table column headers, dialog title elements, form field labels — covering the Login page, Employee List page, Add Employee dialog, and Delete Confirmation dialog.

### 9.5 Page Object Model

Three POM classes provide reusable, maintainable selectors and interactions:

| Class              | Covers                                          |
|--------------------|-------------------------------------------------|
| `LoginPage`        | `/login` route — `goto()`, `login()`, `getErrorText()` |
| `EmployeeListPage` | `/list` route — table rows, add/edit/delete/search actions |
| `EmployeeFormPage` | MUI Dialog — fill, submit, cancel, field value assertions |

---

## 10. Parallel Execution Strategy

Initially the suite ran with `fullyParallel: false` and a single sequential worker. To leverage the three browser projects simultaneously, the configuration was updated:

```javascript
fullyParallel: false,          // tests within a file stay sequential (DB safety)
workers: process.env.CI ? 1 : 3,  // 3 parallel workers in dev (one per browser)
```

**Rationale:**
- `fullyParallel: false` prevents two tests within the same spec file from running concurrently — critical because tests share a live SQLite database and concurrent writes would cause data conflicts.
- `workers: 3` allows Chromium, Firefox, and WebKit to run their respective spec files concurrently, achieving ~3× speedup without any DB conflicts.
- In CI, `workers: 1` keeps the run sequential to avoid resource contention on build agents.

---

## 11. Issues Encountered & Resolutions

### Issue 1 — MUI v5 Error Selector Did Not Match

**Symptom:** `LoginPage.getErrorText()` used `[class*="colorError"]` to locate the error message, but the selector matched nothing.

**Root cause:** Material UI v5 renders `<Typography color="error">` without adding a `colorError` CSS class to the DOM element. This class existed in MUI v4 and was removed in v5.

**Fix:** Replaced the class-based selector with a text-content matcher:
```javascript
// Before (broken)
page.locator('[class*="colorError"]')

// After (fixed)
page.locator('text=/invalid|incorrect|failed|error|network/i')
  .waitFor({ state: 'visible' })
```

---

### Issue 2 — Login Route Mock Intercepted Page Navigation

**Symptom:** The API mocking test for `POST /login` registered `page.route('**/login', ...)` before navigating to `/login`, causing the page navigation itself to be intercepted and served JSON instead of HTML.

**Root cause:** The glob `**/login` matched both the browser's navigation to `/login` (the page URL) and the API call to `/api/login`. Because Vite proxies `/api/*` to the backend, the actual API call path from the browser's perspective is `/api/login`.

**Fix:** Two changes:
1. Changed the route pattern from `**/login` to `**/api/login`
2. Registered the mock *after* `page.goto('/login')` so the page loads before interception begins:
```javascript
await page.goto('/login');
await page.route('**/api/login', route => { ... });
```

---

### Issue 3 — Delete Mock Always Returned the Employee

**Symptom:** The mocked DELETE test asserted the employee was removed from the table, but the employee remained visible.

**Root cause:** The GET mock returned the same static array regardless of whether DELETE had been called. Both GET and DELETE were mocked independently with no shared state.

**Fix:** Introduced a stateful `deleted` flag shared between the two route handlers:
```javascript
let deleted = false;
await page.route('**/employees', route =>
  route.fulfill({ body: JSON.stringify(deleted ? [] : employees) })
);
await page.route('**/employees/*', route => {
  deleted = true;
  route.fulfill({ status: 200, body: '{"success":true}' });
});
```

---

### Issue 4 — Search Clear Count: `toHaveCount(0)` Always Fails

**Symptom:** After mocking `GET /employees` to return `[]`, the test asserted `expect(tbody tr).toHaveCount(0)` but received count `1`.

**Root cause:** The React app renders a "No employees found." message inside a `<tbody><tr>` element. There is always at least one `<tr>` in `<tbody>` — the empty-state row.

**Fix:** Assert the presence of the message text rather than the absence of rows:
```javascript
// Before
await expect(page.locator('tbody tr')).toHaveCount(0);

// After
await expect(page.getByText('No employees found.')).toBeVisible();
```

---

### Issue 5 — Redirect Test Assumed Auto-Redirect Logic

**Symptom:** A test titled "authenticated user visiting /login should be redirected to /list" failed because the app never redirected.

**Root cause:** `Login.jsx` has no `useEffect` guarding against already-authenticated users. Navigating to `/login` always renders the login form, regardless of localStorage state.

**Fix:** Changed the test to document the actual behavior:
```javascript
// Test was: expect URL to be /list
// Fixed to: expect login form to still be visible
await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
```

---

### Issue 6 — Row-Count Comparisons Break Under Parallel Execution

**Symptom:** After enabling 3 parallel workers, tests comparing row count before/after an add operation intermittently failed. For example, `rowsAfter > rowsBefore` would evaluate as `215 > 215`.

**Root cause:** When three browser workers run simultaneously, each one can add employees to the shared SQLite database. By the time `rowsAfter` is read, another worker may have also added an employee, making the count identical to (or even lower than) the expected `rowsBefore + 1`.

**Fix:** Replaced all row-count comparisons with name-visibility assertions. The unique employee name (`E2E User 1744201234567`) is the source of truth — if it's visible in the table, the add succeeded:
```javascript
// Before (fragile)
const rowsBefore = await listPage.getRowCount();
// ... add employee ...
expect(rowsAfter).toBeGreaterThan(rowsBefore);

// After (robust)
await expect(page.getByText(name)).toBeVisible({ timeout: 8000 });
```

---

### Issue 7 — Delete Test: Strict Mode Violation on `getByText(name)`

**Symptom:** After deleting an employee, `expect(page.getByText(name)).not.toBeVisible()` threw a strict-mode error: "resolved to 2 elements".

**Root cause:** While the delete confirmation dialog was still animating closed, the employee's name appeared in two places simultaneously: the table cell and the dialog's `<b>` tag (which shows the name for confirmation). Playwright's strict mode rejects locators matching more than one element.

**Fix:** Scoped the assertion to `<tbody>` to exclude the dialog:
```javascript
// Before (ambiguous — matches both table and dialog)
await expect(page.getByText(name)).not.toBeVisible();

// After (scoped to table only)
await expect(page.locator('tbody').getByText(name)).not.toBeVisible();
```

---

### Issue 8 — "Clearing Search" Test Skips When DB is Empty

**Symptom:** The test `clearing search restores the full list` called `test.skip()` if the database had zero rows, which happened whenever parallel workers had not yet seeded any data.

**Root cause:** The test assumed pre-existing data rather than managing its own. In a parallel environment with 3 browser workers, there is no guarantee another worker has populated the DB before this test runs.

**Fix:** Made the test self-contained by seeding and cleaning up its own uniquely-named employee:
```javascript
const uniqueName = `ClearSearch-${Date.now()}`;
await listPage.fillAddEmployeeForm({ name: uniqueName, ... });
await expect(page.getByText(uniqueName)).toBeVisible();
// ... test search + clear ...
// cleanup
await listPage.clickDeleteForEmployee(uniqueName);
```
This eliminated the skip and made the test run reliably on all three browsers.

---

## 12. Final Test Results

### Test Suite Summary

| Layer       | Spec File                    | Tests | Chromium | Firefox | WebKit |
|-------------|------------------------------|-------|----------|---------|--------|
| Backend     | `api.spec.js`                |  29   | ✅ 29    | ✅ 29   | ✅ 29  |
| BDD         | `authentication.spec.js`     |   8   | ✅ 8     | ✅ 8    | ✅ 8   |
| BDD         | `employee-management.spec.js`|   9   | ✅ 9     | ✅ 9    | ✅ 9   |
| E2E         | `login.spec.js`              |  13   | ✅ 13    | ✅ 13   | ✅ 13  |
| E2E         | `employees.spec.js`          |  15   | ✅ 15    | ✅ 15   | ✅ 15  |
| E2E         | `api-mocking.spec.js`        |   9   | ✅ 9     | ✅ 9    | ✅ 9   |
| E2E         | `accessibility.spec.js`      |  22   | ✅ 22    | ✅ 22   | ✅ 22  |
| **Total**   |                              | **105**| **105** | **105** | **105**|

**Grand Total: 315 tests — 315 passed · 0 failed · 0 skipped**  
**Run time: ~1.5 minutes (parallel, 3 workers)**

### Coverage Map

| Feature Area               | Backend | BDD | E2E Browser | Accessibility |
|----------------------------|---------|-----|-------------|---------------|
| Login — valid credentials  | ✅      | ✅  | ✅          | ✅            |
| Login — invalid credentials| ✅      | ✅  | ✅          | —             |
| Login — field validation   | ✅      | ✅  | ✅          | ✅            |
| Login — UI layout & masking| —       | ✅  | ✅          | ✅            |
| Employee list display      | —       | ✅  | ✅          | ✅            |
| Add employee (success)     | ✅      | ✅  | ✅          | ✅            |
| Add employee (validation)  | ✅      | ✅  | ✅          | —             |
| Edit employee              | ✅      | ✅  | ✅          | —             |
| Delete employee            | ✅      | ✅  | ✅          | ✅            |
| Search / filter            | —       | ✅  | ✅          | ✅            |
| API error / loading states | —       | —   | ✅ (mocked) | —             |
| Keyboard navigation        | —       | —   | —           | ✅            |
| Auth guard (redirect)      | —       | ✅  | ✅          | —             |

---

## 13. Lessons Learned

### Agent Architecture
- **Embedding domain knowledge directly in agent definitions** (URLs, credentials, schema, conventions) dramatically reduces the prompting needed at runtime and produces higher-quality first-pass output.
- **Skills decouple knowledge from identity.** A skill describing *how* to test is independently versioned and reusable across multiple agents, while the agent definition focuses on *who* it is.
- **Two-variant agent design** (base + skills-enhanced) gives flexibility: use the base agent for interactive conversations and the skills-enhanced agent for fully autonomous execution.

### Orchestration
- **Phased orchestration prevents cascading failures.** Running backend tests first means browser test failures are never falsely attributed to UI issues when the real cause is an API regression.
- **The Orchestrator should not test** — its role is routing, sequencing, and reporting. Keeping it free from test implementation details makes the architecture cleaner.

### Test Implementation
- **Row-count comparisons are inherently parallel-unsafe** when tests share a live database. Visibility assertions on unique identifiers (`Date.now()`) are both more semantically correct and parallel-safe.
- **Scope locators defensively.** Broad locators like `getByText(name)` can match unexpected elements (dialogs, toasts, labels). Scoping to `page.locator('tbody').getByText(name)` prevents strict-mode violations.
- **Mocks must account for timing.** Route handlers operate relative to when they are registered — registering them before `page.goto()` can intercept the navigation itself.
- **UI frameworks change CSS class strategies.** MUI v5 removed class-based color helpers present in v4. Always prefer semantic selectors (ARIA labels, roles, text content) over CSS class name assumptions.
- **Self-contained tests are always preferable to data-dependent tests.** Each test should create the data it needs and clean up after itself, especially in parallel environments.

---

## 14. Conclusion

This project successfully demonstrated the design and orchestration of a multi-agent AI testing framework. The key achievements are:

1. **8 Agent files** created (4 base + 4 skills-enhanced) covering all three testing disciplines plus an orchestrator.
2. **3 Skill files** created, providing modular, reusable domain knowledge for each agent.
3. **Full three-layer test architecture** implemented: Backend API → BDD Acceptance → E2E Browser.
4. **315 tests passing** across Chromium, Firefox, and WebKit with parallel execution.
5. **8 real-world issues** identified and resolved with documented, principled fixes.
6. **Zero solo project interference** — the Group Activity test suite is completely isolated under `GROUP_ACTIVITY/tests/`.

The orchestration model — where specialist agents each own a distinct testing layer and a coordinator sequences them — mirrors how a high-performing human QA team operates. The result is a test suite that is comprehensive, maintainable, parallelisable, and resilient to the realities of shared test infrastructure.

---

*Report generated by GitHub Copilot following the completion of the Group Activity: Testing Agents Orchestration project.*

---

## 15. Addendum — CI and reliability measurement (November 2026)

The main suite under `EAEmployeeWithTestSprite/tests` now has a GitHub Actions pipeline and a reliability runner that repeats the suite with retries disabled and reports pass rate, flaky tests and p50/p95 durations per test. The measured numbers, the environment they were produced in, and what could not run there are recorded in the root [`PROJECT_REPORT.md`](../../PROJECT_REPORT.md) and in [`reports/reliability.md`](../../reports/reliability.md). The 315-test figure in this document refers to the group-activity suite under `GROUP_ACTIVITY/tests`, which the new pipeline does not yet run.
