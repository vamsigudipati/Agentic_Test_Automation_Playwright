// @ts-check
// ─── Group Activity: Backend Testing Agent ────────────────────────────────────
// Agent: backend-tester.agent.md / backend-tester-skills.agent.md
// Skill:  backend-api-testing.skill.md
//
// REST API tests for the Employee Management backend at http://localhost:4000
// Uses Playwright's built-in `request` fixture — no extra dependencies needed.
// Run with: npx playwright test backend/ --project=chromium
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:4000';

// ─── Helpers ─────────────────────────────────────────────────────────────────
/** POST a new employee and return the created record */
async function createEmployee(request, overrides = {}) {
  const payload = {
    name:     `Test Employee ${Date.now()}`,
    email:    `test${Date.now()}@example.com`,
    position: 'Test Position',
    ...overrides,
  };
  const res = await request.post(`${BASE_URL}/employees`, { data: payload });
  const body = await res.json();
  return { status: res.status(), body, payload };
}

/** DELETE an employee by id (best-effort cleanup) */
async function deleteEmployee(request, id) {
  await request.delete(`${BASE_URL}/employees/${id}`);
}

// ─── POST /login ──────────────────────────────────────────────────────────────
test.describe('POST /login', () => {
  test('returns 200 and success:true for valid credentials (admin)', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/login`, {
      data: { username: 'admin', password: 'password' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user.username).toBe('admin');
  });

  test('returns 200 for user account', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/login`, {
      data: { username: 'user', password: '123456' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('returns 200 for test account', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/login`, {
      data: { username: 'test', password: 'test123' },
    });
    expect(res.status()).toBe(200);
  });

  test('returns 401 for wrong password', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/login`, {
      data: { username: 'admin', password: 'wrongpassword' },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('returns 401 for unknown username', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/login`, {
      data: { username: 'ghost', password: 'anything' },
    });
    expect(res.status()).toBe(401);
  });

  test('returns 400 when username is missing', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/login`, {
      data: { password: 'password' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('returns 400 when password is missing', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/login`, {
      data: { username: 'admin' },
    });
    expect(res.status()).toBe(400);
  });

  test('returns 400 when body is empty', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/login`, { data: {} });
    expect(res.status()).toBe(400);
  });

  test('response body contains user object with username on success', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/login`, {
      data: { username: 'admin', password: 'password' },
    });
    const body = await res.json();
    expect(body).toHaveProperty('user');
    expect(body.user).toHaveProperty('username', 'admin');
  });
});

// ─── GET /employees ───────────────────────────────────────────────────────────
test.describe('GET /employees', () => {
  test('returns 200', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/employees`);
    expect(res.status()).toBe(200);
  });

  test('returns a JSON array', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/employees`);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('each employee object has required fields', async ({ request }) => {
    // Create one to ensure at least one exists
    const { body: created } = await createEmployee(request);
    const res  = await request.get(`${BASE_URL}/employees`);
    const list = await res.json();
    const employee = list.find(e => e.id === created.id);
    expect(employee).toBeDefined();
    expect(employee).toHaveProperty('id');
    expect(employee).toHaveProperty('name');
    expect(employee).toHaveProperty('email');
    expect(employee).toHaveProperty('position');
    // Cleanup
    await deleteEmployee(request, created.id);
  });
});

// ─── POST /employees ──────────────────────────────────────────────────────────
test.describe('POST /employees', () => {
  let createdId;

  test.afterEach(async ({ request }) => {
    if (createdId) {
      await deleteEmployee(request, createdId);
      createdId = null;
    }
  });

  test('creates an employee and returns 200 with the new record', async ({ request }) => {
    const payload = {
      name:     `New Employee ${Date.now()}`,
      email:    `new${Date.now()}@example.com`,
      position: 'Developer',
    };
    const res  = await request.post(`${BASE_URL}/employees`, { data: payload });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    expect(body.name).toBe(payload.name);
    expect(body.email).toBe(payload.email);
    expect(body.position).toBe(payload.position);
    createdId = body.id;
  });

  test('created employee appears in GET /employees', async ({ request }) => {
    const { body } = await createEmployee(request);
    createdId = body.id;
    const listRes = await request.get(`${BASE_URL}/employees`);
    const list    = await listRes.json();
    expect(list.find(e => e.id === createdId)).toBeDefined();
  });

  test('returns 400 when name is missing', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/employees`, {
      data: { email: 'missing@name.com', position: 'Dev' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/required/i);
  });

  test('returns 400 when email is missing', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/employees`, {
      data: { name: 'No Email', position: 'Dev' },
    });
    expect(res.status()).toBe(400);
  });

  test('returns 400 when position is missing', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/employees`, {
      data: { name: 'No Position', email: 'np@test.com' },
    });
    expect(res.status()).toBe(400);
  });

  test('returns 400 when body is empty', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/employees`, { data: {} });
    expect(res.status()).toBe(400);
  });

  test('returns 400 when all fields are empty strings', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/employees`, {
      data: { name: '', email: '', position: '' },
    });
    expect(res.status()).toBe(400);
  });
});

// ─── PUT /employees/:id ───────────────────────────────────────────────────────
test.describe('PUT /employees/:id', () => {
  let employeeId;

  test.beforeEach(async ({ request }) => {
    const { body } = await createEmployee(request);
    employeeId = body.id;
  });

  test.afterEach(async ({ request }) => {
    await deleteEmployee(request, employeeId);
  });

  test('updates all fields and returns 200 with updated record', async ({ request }) => {
    const updates = { name: 'Updated Name', email: 'updated@test.com', position: 'Senior Dev' };
    const res  = await request.put(`${BASE_URL}/employees/${employeeId}`, { data: updates });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.name).toBe(updates.name);
    expect(body.email).toBe(updates.email);
    expect(body.position).toBe(updates.position);
  });

  test('updated values persist in GET /employees', async ({ request }) => {
    const updates = { name: 'Persisted Name', email: 'persisted@test.com', position: 'PM' };
    await request.put(`${BASE_URL}/employees/${employeeId}`, { data: updates });
    const listRes = await request.get(`${BASE_URL}/employees`);
    const list    = await listRes.json();
    const emp = list.find(e => e.id === employeeId);
    expect(emp.name).toBe(updates.name);
  });

  test('returns 404 for a non-existent employee id', async ({ request }) => {
    const res = await request.put(`${BASE_URL}/employees/999999`, {
      data: { name: 'Ghost', email: 'ghost@test.com', position: 'Phantom' },
    });
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error).toMatch(/not found/i);
  });

  test('returns 400 when name is missing', async ({ request }) => {
    const res = await request.put(`${BASE_URL}/employees/${employeeId}`, {
      data: { email: 'e@test.com', position: 'Dev' },
    });
    expect(res.status()).toBe(400);
  });

  test('returns 400 when email is missing', async ({ request }) => {
    const res = await request.put(`${BASE_URL}/employees/${employeeId}`, {
      data: { name: 'Name', position: 'Dev' },
    });
    expect(res.status()).toBe(400);
  });

  test('returns 400 when position is missing', async ({ request }) => {
    const res = await request.put(`${BASE_URL}/employees/${employeeId}`, {
      data: { name: 'Name', email: 'e@test.com' },
    });
    expect(res.status()).toBe(400);
  });
});

// ─── DELETE /employees/:id ────────────────────────────────────────────────────
test.describe('DELETE /employees/:id', () => {
  test('deletes an existing employee and returns 200', async ({ request }) => {
    const { body } = await createEmployee(request);
    const res = await request.delete(`${BASE_URL}/employees/${body.id}`);
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    expect(resBody.success).toBe(true);
  });

  test('deleted employee no longer appears in GET /employees', async ({ request }) => {
    const { body } = await createEmployee(request);
    await request.delete(`${BASE_URL}/employees/${body.id}`);
    const listRes = await request.get(`${BASE_URL}/employees`);
    const list    = await listRes.json();
    expect(list.find(e => e.id === body.id)).toBeUndefined();
  });

  test('returns 404 for a non-existent employee id', async ({ request }) => {
    const res = await request.delete(`${BASE_URL}/employees/999999`);
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error).toMatch(/not found/i);
  });

  test('double-deleting the same employee returns 404 on second call', async ({ request }) => {
    const { body } = await createEmployee(request);
    await request.delete(`${BASE_URL}/employees/${body.id}`);
    const res2 = await request.delete(`${BASE_URL}/employees/${body.id}`);
    expect(res2.status()).toBe(404);
  });
});
