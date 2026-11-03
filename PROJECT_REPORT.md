# Project Report — CI and Reliability

**Date:** 3 November 2026
**Scope:** `EAEmployeeWithTestSprite/tests` (the main Playwright suite: 57 specs, 5 browser projects)
**Related:** [`EAEmployeeWithTestSprite/GROUP_ACTIVITY/PROJECT_REPORT.md`](EAEmployeeWithTestSprite/GROUP_ACTIVITY/PROJECT_REPORT.md) covers the separate multi-agent group-activity suite.

This report records what was added to make the project's quality claims verifiable: a CI pipeline that runs the suite on every push, a reliability runner that repeats the suite with retries disabled, and the real numbers it produced in the environment described below.

---

## 1. What was added

| Area | Change |
|---|---|
| CI | `.github/workflows/playwright.yml` rewritten: `npm ci` for backend/frontend/tests, `npx playwright install --with-deps`, app boot with health checks, headless run on push and PR, HTML report and traces uploaded on every run, server logs on failure. A second `reliability` job repeats the Chromium suite N times and publishes `reports/`. |
| Reliability runner | `EAEmployeeWithTestSprite/tests/scripts/reliability.js` (no third-party dependencies). Runs `playwright test --retries=0 --reporter=json` N times, parses the JSON reports, and writes `reports/reliability.json` and `reports/reliability.md` with pass rate, flaky tests, consistently failing tests and p50/p95 duration per test. |
| Playwright version | `@playwright/test` pinned to 1.63.0 (was `^1.49.0`, lockfile at 1.59.1) so local, CI and the preinstalled browser bundle agree on the Chromium build. |
| Visual baselines | `chromium-linux` snapshots added next to the existing `chromium-darwin` ones. Without them every visual test fails on Linux with "A snapshot doesn't exist". |
| Config | `trace` is `retain-on-failure` under `CI` so every failed attempt leaves a trace that the workflow uploads. Previously `on-first-retry` only captured the first retry. |
| Housekeeping | `.gitignore` no longer ignores the workflow file. |

---

## 2. Measurement environment

| Item | Value |
|---|---|
| Date | 2026-11-03T19:36:56.238Z |
| Machine | Claude Code cloud container, linux 6.18.44-fc-v230 (x64) |
| Node | v22.23.4 |
| Playwright | 1.63.0 (preinstalled Chromium build 1243) |
| Projects run | chromium (57 tests per run) |
| Runs | 5, `--retries=0` |
| Command | `node scripts/reliability.js --runs 5 --project chromium --out ../../reports` |

Limitations of this environment, stated plainly:

- **Only Chromium could run.** Firefox and WebKit are not preinstalled and `npx playwright install` cannot download them here (the browser CDN is blocked by the session's network policy). The `firefox`, `webkit`, `mobile-chrome` and `mobile-safari` projects were therefore not executed; CI runs all five.
- The app (Express + SQLite backend, Vite dev server frontend) ran locally in the same container, so network latency is near zero. CI numbers will be somewhat slower.
- The Linux visual baselines were rendered in this container. If the fonts on `ubuntu-latest` differ, the visual tests will fail in CI with a pixel diff and need `--update-snapshots` from a CI-rendered run. This is a known risk, not a verified outcome.

---

## 3. Reliability results

### Summary

| Metric | Value |
|---|---|
| Runs | 5 |
| Tests per run | 57 |
| Test executions | 285 |
| **Pass rate** | **100%** (285 passed, 0 failed) |
| Stable tests | 57 |
| Flaky tests | 0 |
| Consistently failing tests | 0 |
| Fully green runs | 5 / 5 |
| Suite duration p50 / p95 | 53.0s / 56.1s (min 47.4s, max 56.1s) |

### Per run

| Run | Passed | Failed | Skipped | Duration |
|---|---|---|---|---|
| 1 | 57 | 0 | 0 | 47.4s |
| 2 | 57 | 0 | 0 | 53.0s |
| 3 | 57 | 0 | 0 | 51.4s |
| 4 | 57 | 0 | 0 | 54.4s |
| 5 | 57 | 0 | 0 | 56.1s |

### Per spec file

| Spec file | Tests | Executions passed / failed | Max p95 in file |
|---|---|---|---|
| `api-mocking.spec.js` | 12 | 60 / 0 | 3.2s |
| `employees.spec.js` | 22 | 110 / 0 | 5.1s |
| `login.spec.js` | 12 | 60 / 0 | 2.0s |
| `visual.spec.js` | 11 | 55 / 0 | 1.9s |

### Flaky tests

None.

### Consistently failing tests

None.

### Slowest tests (p95)

| Test | p50 | p95 | min | max |
|---|---|---|---|---|
| `employees.spec.js:201` Employee – Edit › should save edited employee and reflect the change in the list | 4.0s | 5.1s | 3.5s | 5.1s |
| `employees.spec.js:72` Employee – Add › should add a new employee and show it in the list | 4.1s | 4.4s | 3.5s | 4.4s |
| `api-mocking.spec.js:266` API Mocking – Loading States › should show loading indicator while waiting for employees to load | 3.0s | 3.2s | 3.0s | 3.2s |
| `employees.spec.js:252` Employee – Delete › should cancel deletion and keep the employee in the list | 2.7s | 2.8s | 2.0s | 2.8s |
| `employees.spec.js:265` Employee – Delete › should delete the employee and remove it from the list | 2.7s | 2.8s | 2.0s | 2.8s |

The per-test table for all tests is in [`reports/reliability.md`](reports/reliability.md); the raw data is in [`reports/reliability.json`](reports/reliability.json).

---

## 4. How to reproduce

```bash
cd EAEmployeeWithTestSprite/tests
npm ci && npx playwright install chromium
node scripts/reliability.js --runs 5 --project chromium --start-app --out ../../reports
```

`--start-app` boots the backend and frontend and waits for both health checks; omit it if they are already running. The full options are listed in the README's Reliability section. In CI the same command runs in the `reliability` job and the Markdown appears on the job summary page.

---

## 5. Observations

- **No flakiness was observed on Chromium**: 57 tests, 5 runs, 285 executions, every outcome identical. This is consistent with the suite design (sequential execution against the shared SQLite backend, unique names per run, assertions scoped to `tbody`), but it is a Chromium-only, single-machine result. Cross-browser flakiness is the thing CI's `reliability` job will show first.
- **Suite time drifts upward run over run** (47.4s on run 1 to 56.1s on run 5). The slowest tests are the CRUD flows that round-trip through the real backend. The upward drift is worth watching: if it continues over many runs it points at state accumulating in the backend's `db.sqlite` (after the 5 measured runs plus one warm-up run the backend held 72 employee rows, so some tests add rows they never delete, and the list page renders all of them).
- **The 1.0 minute "first run" quoted in the README includes writing missing Linux snapshots.** With baselines present the suite settles at roughly 50 seconds on Chromium.
- **Retries hide information.** The CI `e2e` job keeps `retries: 2` for a stable signal, while the reliability job runs with `--retries=0`. Keep both: one answers "did the build pass", the other "how often would it pass without help".
- **Next measurements to add**: the other four browser projects (needs a machine that can download Playwright browsers), and a run of the group-activity suite under `GROUP_ACTIVITY/tests`, which the current pipeline does not execute.
