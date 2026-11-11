import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { createTestServer } from './helpers/testServer.ts';
import type { TestServerContext } from './helpers/testServer.ts';
import { getClientErrorMessage } from '../../web/src/utils/errorHandler.ts';

describe('Feature 5, 10 & 21: Strict RBAC Boundary Attack & Error Sanitization', () => {
  let ctx: TestServerContext;

  before(async () => {
    ctx = await createTestServer();
  });

  after(async () => {
    await ctx.close();
  });

  // 1. Guest / Unauthenticated Boundary Tests
  it('T2-SEC-01: Guest request to GET /api/admin/media rejected with 401', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/admin/media`);
    assert.strictEqual(res.status, 401);
    const body = (await res.json()) as any;
    assert.strictEqual(body.ok, false);
  });

  it('T2-SEC-02: Guest request to POST /api/admin/media/upload rejected with 401', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/admin/media/upload`, {
      method: 'POST',
      body: new FormData(),
    });
    assert.strictEqual(res.status, 401);
  });

  it('T2-SEC-03: Guest request to POST /api/admin/media/check-usage rejected with 401', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/admin/media/check-usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: [] }),
    });
    assert.strictEqual(res.status, 401);
  });

  it('T2-SEC-04: Guest request to POST /api/admin/media/delete rejected with 401', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/admin/media/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: [] }),
    });
    assert.strictEqual(res.status, 401);
  });

  // 2. Normal User Boundary Tests
  it('T2-SEC-05: User role token to GET /api/admin/media rejected with 403 Forbidden', async () => {
    const res = await ctx.fetch('/api/admin/media', {
      headers: { Authorization: 'Bearer user-token' },
    });
    assert.strictEqual(res.status, 403);
    const body = (await res.json()) as any;
    assert.strictEqual(body.ok, false);
    assert(body.error.includes('Không có quyền truy cập'));
  });

  it('T2-SEC-06: User role token to POST /api/admin/media/upload rejected with 403 Forbidden', async () => {
    const res = await ctx.fetch('/api/admin/media/upload', {
      method: 'POST',
      headers: { Authorization: 'Bearer user-token' },
      body: new FormData(),
    });
    assert.strictEqual(res.status, 403);
  });

  it('T2-SEC-07: User role token to POST /api/admin/media/delete rejected with 403 Forbidden', async () => {
    const res = await ctx.fetch('/api/admin/media/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-token',
      },
      body: JSON.stringify({ keys: ['test.png'] }),
    });
    assert.strictEqual(res.status, 403);
  });

  // 3. Subadmin Strict Shop RBAC Tests (GEMINI.md §6)
  it('T2-SEC-08: Subadmin role is constrained to user in Shop and receives 403 on GET media', async () => {
    const res = await ctx.fetch('/api/admin/media', {
      headers: { Authorization: 'Bearer subadmin-token' },
    });
    assert.strictEqual(res.status, 403);
    const body = (await res.json()) as any;
    assert.strictEqual(body.ok, false);
    assert(body.error.includes('Không có quyền truy cập'));
  });

  it('T2-SEC-09: Subadmin role cannot delete media files in Shop (403 Forbidden)', async () => {
    const res = await ctx.fetch('/api/admin/media/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer subadmin-token',
      },
      body: JSON.stringify({ keys: ['banner.png'] }),
    });
    assert.strictEqual(res.status, 403);
  });

  // 4. Admin Full Access Tests
  it('T1-SEC-01: Admin token grants full access to GET /api/admin/media', async () => {
    const res = await ctx.fetch('/api/admin/media');
    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.ok, true);
  });

  // 5. Dual-Standard Error Sanitization Tests (GEMINI.md §4)
  it('T2-F21-01: Public/Non-admin errors are sanitized with polite generic Vietnamese message', () => {
    const technicalError = {
      message: 'PGRST204: column error: relation public.items does not exist in schema',
      code: 'PGRST204',
      details: 'SELECT * FROM public.items WHERE id = 123',
    };

    const sanitizedMessage = getClientErrorMessage(technicalError, false);
    assert.strictEqual(
      sanitizedMessage,
      'Đã có lỗi xảy ra trong quá trình xử lý, vui lòng thử lại sau hoặc liên hệ hỗ trợ.'
    );
    // Zero technical leakage
    assert.strictEqual(sanitizedMessage.includes('PGRST'), false);
    assert.strictEqual(sanitizedMessage.includes('SELECT'), false);
    assert.strictEqual(sanitizedMessage.includes('relation'), false);
    assert.strictEqual(sanitizedMessage.includes('items'), false);
  });

  it('T2-F21-02: Admin route errors disclose full technical details for debugging', () => {
    const technicalError = {
      message: 'PGRST204: column error: relation public.items does not exist in schema',
      code: 'PGRST204',
      details: 'SELECT * FROM public.items WHERE id = 123',
    };

    const adminMessage = getClientErrorMessage(technicalError, true);
    assert(adminMessage.includes('PGRST204'));
    assert(adminMessage.includes('relation public.items does not exist'));
  });
});
