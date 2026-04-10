---
name: backend-api-testing
description: 'Skill for testing the Employee Management REST API at http://localhost:4000. Provides a structured checklist for validating all endpoints, status codes, and response payloads.'
---

# Backend API Testing Skill

This skill guides the Backend Tester agent through systematic validation of the Employee Management REST API.

## Specific Instructions

1. **Confirm the server is running**:
   ```bash
   curl -s http://localhost:4000/employees
   ```
   If it fails, instruct the user to start the backend (`cd backend && node server.js`).

2. **Test POST /login**:
   - Valid creds (`admin`/`password`) → expect `200`, `{ success: true }`
   - Invalid password → expect `401`, `{ success: false }`
   - Missing fields (no username, no password, empty body) → expect `400`

3. **Test GET /employees**:
   - Expect `200` and a JSON array
   - Each item must have `id`, `name`, `email`, `position`

4. **Test POST /employees**:
   - All fields present → expect `200`, returned object includes `id`
   - Missing any field → expect `400`, `{ error: "All fields are required" }`

5. **Test PUT /employees/:id**:
   - Use the `id` from step 4
   - Valid update → expect `200`, updated fields reflected
   - Non-existent id (e.g. `99999`) → expect `404`
   - Missing fields → expect `400`

6. **Test DELETE /employees/:id**:
   - Valid id → expect `200`, `{ success: true }`
   - Run `GET /employees` to confirm the record is gone
   - Non-existent id → expect `404`

7. **Clean up** any test records created during the run.

8. **Report** results: endpoint, expected status, actual status, pass/fail.

## Output Format

Return a table like:

| Endpoint              | Scenario              | Expected | Actual | Result |
|-----------------------|-----------------------|----------|--------|--------|
| POST /login           | Valid credentials     | 200      | 200    | ✅     |
| POST /login           | Wrong password        | 401      | 401    | ✅     |
| GET /employees        | Returns array         | 200      | 200    | ✅     |
| POST /employees       | Missing name field    | 400      | 400    | ✅     |
| ...                   | ...                   | ...      | ...    | ...    |
