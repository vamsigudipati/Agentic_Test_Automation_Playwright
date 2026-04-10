---
name: bdd-scenario-writing
description: 'Skill for writing Behavior-Driven Development (BDD) Gherkin scenarios for the Employee Management app. Guides the BDD Tester agent to express user stories as Given/When/Then acceptance criteria.'
---

# BDD Scenario Writing Skill

This skill guides the BDD Tester agent to create high-quality Gherkin feature files for the Employee Management application.

## Specific Instructions

1. **Identify the feature** being tested (e.g., Login, Add Employee, Search).

2. **Write a Feature block** with:
   - A clear feature title
   - An "As a / I want / So that" user story statement

3. **Define a Background** block for shared preconditions (e.g., being logged in).

4. **Write Scenarios** using strict Given/When/Then format:
   - `Given` – precondition / initial state
   - `When` – the action the user takes
   - `Then` – the observable outcome
   - `And` / `But` – additional steps in the same clause

5. **Cover these scenario types** for each feature:
   - ✅ Happy path (valid input, expected success)
   - ❌ Sad path (invalid input, expected error)
   - 🔲 Edge case (boundary values, empty states)

6. **Map each scenario** to an existing spec file in `tests/e2e/` if coverage exists, or flag as a gap.

7. **Use declarative language** — describe *what* not *how*:
   - ✅ "Then I should see the employee in the table"
   - ❌ "Then the GET /employees response should include the record"

8. **Produce a Feature file** for each area:
   - `tests/e2e/features/authentication.feature`
   - `tests/e2e/features/employee-management.feature`

9. **List uncovered scenarios** as a gap report.

10. **Provide a summary** of: total scenarios written, mapped tests, and gaps found.

## Output Format

Return:
- Complete `.feature` file content in Gherkin syntax
- Mapping table (Scenario → existing spec file)
- Gap list of unautomated scenarios
- Suggested step definition stubs (JavaScript/Cucumber.js format) if requested
