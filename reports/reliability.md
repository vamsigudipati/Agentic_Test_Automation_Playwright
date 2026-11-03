# Reliability report

Generated 2026-11-03T19:36:56.238Z · Playwright 1.63.0 · Node v22.23.4 · linux 6.18.44-fc-v230 (x64)

```
node scripts/reliability.js --runs 5 --project chromium --out ../../reports
```

## Summary

| Metric | Value |
|---|---|
| Runs | 5 (project: chromium, retries: 0) |
| Tests per run | 57 |
| Test executions | 285 (285 passed, 0 failed) |
| **Pass rate** | **100%** |
| Stable tests (passed every run) | 57 |
| Flaky tests (passed and failed) | 0 |
| Failing tests (failed every run) | 0 |
| Skipped tests | 0 |
| Fully green runs | 5 / 5 |
| Suite duration p50 / p95 | 53.0s / 56.1s |

## Runs

| Run | Passed | Failed | Skipped | Duration |
|---|---|---|---|---|
| 1 | 57 | 0 | 0 | 47.4s |
| 2 | 57 | 0 | 0 | 53.0s |
| 3 | 57 | 0 | 0 | 51.4s |
| 4 | 57 | 0 | 0 | 54.4s |
| 5 | 57 | 0 | 0 | 56.1s |

## Flaky tests

None. Every test produced the same outcome in all runs.

## Consistently failing tests

None.

## Per-test statistics

Outcomes are one letter per run: `P` passed, `F` failed, `S` skipped. Durations are per attempt (nearest-rank percentiles).

| Test | Project | Outcomes | Pass rate | p50 | p95 | Status |
|---|---|---|---|---|---|---|
| employees.spec.js:201 Employee – Edit › should save edited employee and reflect the change in the list | chromium | `PPPPP` | 100% | 4.0s | 5.1s | stable |
| employees.spec.js:72 Employee – Add › should add a new employee and show it in the list | chromium | `PPPPP` | 100% | 4.1s | 4.4s | stable |
| api-mocking.spec.js:266 API Mocking – Loading States › should show loading indicator while waiting for employees to load | chromium | `PPPPP` | 100% | 3.0s | 3.2s | stable |
| employees.spec.js:252 Employee – Delete › should cancel deletion and keep the employee in the list | chromium | `PPPPP` | 100% | 2.7s | 2.8s | stable |
| employees.spec.js:265 Employee – Delete › should delete the employee and remove it from the list | chromium | `PPPPP` | 100% | 2.7s | 2.8s | stable |
| employees.spec.js:241 Employee – Delete › should open the Delete confirmation dialog | chromium | `PPPPP` | 100% | 2.0s | 2.7s | stable |
| employees.spec.js:155 Employee – View › should close the View dialog when Close is clicked | chromium | `PPPPP` | 100% | 2.3s | 2.7s | stable |
| employees.spec.js:64 Employee – Add › should close the Add Employee dialog when cancelled/closed | chromium | `PPPPP` | 100% | 2.2s | 2.7s | stable |
| employees.spec.js:193 Employee – Edit › should pre-populate the edit form with current employee values | chromium | `PPPPP` | 100% | 1.9s | 2.6s | stable |
| employees.spec.js:316 Employee – Search › should restore full list when search is cleared | chromium | `PPPPP` | 100% | 2.0s | 2.5s | stable |
| employees.spec.js:58 Employee – Add › should open the Add Employee dialog when the button is clicked | chromium | `PPPPP` | 100% | 2.0s | 2.4s | stable |
| employees.spec.js:184 Employee – Edit › should open the Edit Employee dialog | chromium | `PPPPP` | 100% | 2.0s | 2.4s | stable |
| employees.spec.js:310 Employee – Search › should show "No employees found." when search has no results | chromium | `PPPPP` | 100% | 2.0s | 2.2s | stable |
| api-mocking.spec.js:222 API Mocking – Add Employee › should show error alert when POST /api/employees returns 500 | chromium | `PPPPP` | 100% | 1.7s | 2.2s | stable |
| employees.spec.js:102 Employee – Add › should not add an employee when required fields are missing | chromium | `PPPPP` | 100% | 1.9s | 2.0s | stable |
| login.spec.js:31 Login Page › should login successfully with valid credentials (user/123456) | chromium | `PPPPP` | 100% | 1.6s | 2.0s | stable |
| api-mocking.spec.js:245 API Mocking – Add Employee › should show network error when POST /api/employees request is aborted | chromium | `PPPPP` | 100% | 1.9s | 2.0s | stable |
| employees.spec.js:33 Employee List Page › should display the "+ Add Employee" button | chromium | `PPPPP` | 100% | 1.5s | 2.0s | stable |
| employees.spec.js:295 Employee – Search › should filter the list when typing in the search box | chromium | `PPPPP` | 100% | 1.9s | 2.0s | stable |
| employees.spec.js:141 Employee – View › should display correct employee details in the View dialog | chromium | `PPPPP` | 100% | 1.8s | 2.0s | stable |
| login.spec.js:25 Login Page › should login successfully with valid credentials (admin/password) | chromium | `PPPPP` | 100% | 1.7s | 1.9s | stable |
| login.spec.js:36 Login Page › should login successfully with valid credentials (test/test123) | chromium | `PPPPP` | 100% | 1.7s | 1.9s | stable |
| visual.spec.js:163 Visual – Dialogs › dialog – Edit Employee form | chromium | `PPPPP` | 100% | 1.4s | 1.9s | stable |
| employees.spec.js:37 Employee List Page › should display the search field | chromium | `PPPPP` | 100% | 1.6s | 1.9s | stable |
| employees.spec.js:29 Employee List Page › should display "Employee List" heading | chromium | `PPPPP` | 100% | 1.5s | 1.9s | stable |
| api-mocking.spec.js:196 API Mocking – Add Employee › should show error alert when POST /api/employees returns 400 | chromium | `PPPPP` | 100% | 1.9s | 1.9s | stable |
| visual.spec.js:111 Visual – Employee List Page › employee list – dark mode | chromium | `PPPPP` | 100% | 1.6s | 1.8s | stable |
| visual.spec.js:145 Visual – Dialogs › dialog – Add Employee form | chromium | `PPPPP` | 100% | 1.8s | 1.8s | stable |
| employees.spec.js:41 Employee List Page › should display the employee table with expected columns | chromium | `PPPPP` | 100% | 1.5s | 1.8s | stable |
| visual.spec.js:102 Visual – Employee List Page › employee list – empty state | chromium | `PPPPP` | 100% | 1.4s | 1.8s | stable |
| employees.spec.js:129 Employee – View › should open the Employee Details dialog when View is clicked | chromium | `PPPPP` | 100% | 1.6s | 1.8s | stable |
| visual.spec.js:154 Visual – Dialogs › dialog – View Employee details | chromium | `PPPPP` | 100% | 1.6s | 1.7s | stable |
| visual.spec.js:122 Visual – Employee List Page › employee list – search results filtered | chromium | `PPPPP` | 100% | 1.5s | 1.7s | stable |
| api-mocking.spec.js:85 API Mocking – Login › should redirect to /list after mocked successful login | chromium | `PPPPP` | 100% | 1.4s | 1.6s | stable |
| visual.spec.js:90 Visual – Employee List Page › employee list – populated with data | chromium | `PPPPP` | 100% | 1.5s | 1.6s | stable |
| visual.spec.js:68 Visual – Login Page › login page – with invalid credentials error | chromium | `PPPPP` | 100% | 1.4s | 1.5s | stable |
| visual.spec.js:61 Visual – Login Page › login page – dark mode | chromium | `PPPPP` | 100% | 1.3s | 1.5s | stable |
| api-mocking.spec.js:125 API Mocking – Employee List › should display an error alert when GET /api/employees returns 500 | chromium | `PPPPP` | 100% | 1.3s | 1.5s | stable |
| login.spec.js:53 Login Page › should show an error for wrong password with valid username | chromium | `PPPPP` | 100% | 1.3s | 1.5s | stable |
| api-mocking.spec.js:109 API Mocking – Employee List › should display an empty state when API returns an empty array | chromium | `PPPPP` | 100% | 1.3s | 1.4s | stable |
| login.spec.js:62 Login Page › should not submit the form when username is empty (HTML5 validation) | chromium | `PPPPP` | 100% | 1.2s | 1.4s | stable |
| login.spec.js:42 Login Page › should show an error message for invalid username/password | chromium | `PPPPP` | 100% | 1.3s | 1.4s | stable |
| login.spec.js:71 Login Page › should not submit the form when password is empty (HTML5 validation) | chromium | `PPPPP` | 100% | 1.1s | 1.4s | stable |
| api-mocking.spec.js:153 API Mocking – Employee List › should render mocked employees correctly in the table | chromium | `PPPPP` | 100% | 1.3s | 1.4s | stable |
| visual.spec.js:172 Visual – Dialogs › dialog – Delete Employee confirmation | chromium | `PPPPP` | 100% | 1.4s | 1.4s | stable |
| visual.spec.js:55 Visual – Login Page › login page – light mode | chromium | `PPPPP` | 100% | 1.1s | 1.4s | stable |
| login.spec.js:93 Login Page › should redirect unauthenticated users to /login when visiting /list | chromium | `PPPPP` | 100% | 1.2s | 1.3s | stable |
| api-mocking.spec.js:142 API Mocking – Employee List › should display a network error alert when GET /api/employees request is aborted | chromium | `PPPPP` | 100% | 1.3s | 1.3s | stable |
| api-mocking.spec.js:37 API Mocking – Login › should show error when login API returns 401 | chromium | `PPPPP` | 100% | 1.2s | 1.3s | stable |
| api-mocking.spec.js:54 API Mocking – Login › should show error when login API returns 500 server error | chromium | `PPPPP` | 100% | 1.1s | 1.3s | stable |
| login.spec.js:87 Login Page › should redirect unauthenticated users to /login when visiting / | chromium | `PPPPP` | 100% | 1.2s | 1.2s | stable |
| api-mocking.spec.js:74 API Mocking – Login › should show network error message when login request fails | chromium | `PPPPP` | 100% | 1.1s | 1.2s | stable |
| employees.spec.js:332 Authentication Guard › should redirect to /login when visiting /list without auth | chromium | `PPPPP` | 100% | 1.0s | 1.1s | stable |
| login.spec.js:18 Login Page › should display the login form | chromium | `PPPPP` | 100% | 944ms | 1.1s | stable |
| login.spec.js:83 Login Page › should show the app title in the navbar | chromium | `PPPPP` | 100% | 913ms | 1.1s | stable |
| login.spec.js:79 Login Page › should mask the password field | chromium | `PPPPP` | 100% | 950ms | 1.1s | stable |
| employees.spec.js:339 Authentication Guard › should redirect to /login when visiting /form without auth | chromium | `PPPPP` | 100% | 1.0s | 1.0s | stable |
