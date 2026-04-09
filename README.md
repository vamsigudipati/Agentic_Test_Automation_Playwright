# Agentic Test Automation with Playwright

A comprehensive end-to-end test suite for the **Employee Manager** web application, built with [Playwright](https://playwright.dev/). This project was created using an AI coding agent (GitHub Copilot) to demonstrate agentic test automation — from app exploration to full test coverage, all driven by natural language instructions.

## Project Structure

```
├── .github/
│   └── workflows/
│       └── playwright.yml          # CI/CD pipeline (GitHub Actions)
├── EAEmployeeWithTestSprite/
│   ├── backend/                    # Node.js + Express + SQLite API (port 4000)
│   ├── frontend/                   # React 19 + MUI v7 + Vite (port 5173)
│   └── tests/
│       ├── playwright.config.js    # Playwright configuration
│       └── e2e/
│           ├── pages/
│           │   ├── LoginPage.js          # Page Object Model
│           │   └── EmployeeListPage.js   # Page Object Model
│           ├── login.spec.js             # Login flow tests
│           ├── employees.spec.js         # Employee CRUD tests
│           ├── api-mocking.spec.js       # API mocking / error state tests
│           └── visual.spec.js            # Visual regression tests
```

## Test Coverage

| Suite | Tests | Description |
|-------|-------|-------------|
| `login.spec.js` | 10 | Login form, valid/invalid credentials, redirects, UI elements |
| `employees.spec.js` | 24 | Employee CRUD (Add, View, Edit, Delete), search, auth guards |
| `api-mocking.spec.js` | 12 | Error states, network failures, loading spinners (no live backend needed) |
| `visual.spec.js` | 11 | Screenshot regression — login, employee list, dialogs, dark mode |
| **Total** | **57 specs × 5 projects = 197 tests** | |

## Browser Coverage

| Project | Browser / Device |
|---------|-----------------|
| `chromium` | Desktop Chrome |
| `firefox` | Desktop Firefox |
| `webkit` | Desktop Safari |
| `mobile-chrome` | Pixel 7 (Android) |
| `mobile-safari` | iPhone 14 (iOS) |

> Visual regression tests run on Chromium only to keep snapshots deterministic.

## Tech Stack

- **Frontend**: React 19, MUI v7, React Router v7, Vite
- **Backend**: Node.js, Express, SQLite3
- **Test Framework**: Playwright v1.49
- **CI/CD**: GitHub Actions

## Getting Started

### Prerequisites

- Node.js 18+
- Docker (optional, for containerised run)

### 1. Start the Application

**Backend** (port 4000):
```bash
cd EAEmployeeWithTestSprite/backend
npm install
node server.js
```

**Frontend** (port 5173):
```bash
cd EAEmployeeWithTestSprite/frontend
npm install
npm run dev
```

### 2. Install Test Dependencies

```bash
cd EAEmployeeWithTestSprite/tests
npm install
npx playwright install
```

### 3. Run Tests

```bash
# Run all 197 tests across all browsers
npx playwright test

# Run a specific suite
npx playwright test e2e/login.spec.js

# Run only Chromium
npx playwright test --project=chromium

# Run with visible browser (headed mode)
npx playwright test --headed

# Update visual regression snapshots
npx playwright test --update-snapshots
```

### 4. View HTML Report

```bash
npx playwright show-report
```

## CI/CD

The GitHub Actions workflow (`.github/workflows/playwright.yml`) automatically:

1. Installs dependencies
2. Starts the backend and frontend servers
3. Waits for both to be healthy
4. Runs the full Playwright test suite
5. Uploads the HTML report as an artifact (retained 30 days)
6. Uploads test results on failure (retained 7 days)

Triggers on every push or pull request to `main` / `master`.

## Demo Credentials

| Username | Password |
|----------|----------|
| `admin` | `password` |
| `user` | `123456` |
| `test` | `test123` |

## How This Was Built

This test suite was created end-to-end by a **GitHub Copilot AI agent** given only the running application and natural language instructions:

1. **App exploration** — Playwright MCP was used to navigate the live app and understand its structure
2. **Test design** — Page Object Models, test suites, and fixtures were generated from source code analysis
3. **Debugging** — All 8 initial failures were diagnosed and fixed autonomously (strict-mode locator conflicts, race conditions, MUI-specific selector issues)
4. **Coverage expansion** — API mocking, visual regression, cross-browser config, and CI/CD pipeline added on request
5. **Git workflow** — Security scan, staging, commit, and push to GitHub all handled by the agent

> Total tests passing: **197 / 197**
