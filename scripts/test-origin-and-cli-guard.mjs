import assert from 'assert';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

process.env.SUPABASE_URL = 'https://mock.supabase.co';
process.env.SUPABASE_ANON_KEY = 'mock_anon_key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock_service_key';
process.env.CORS_ORIGIN = 'https://flashcard.huytutor.edu.vn,https://huytutor.edu.vn';
process.env.JWT_SECRET = 'mock_secret_key_1234567890!';

// Import middlewares
const ssoCorsModule = await import(`file://${rootDir}/sso/api/dist/middlewares/cors.js`);
const { corsMiddleware: ssoCors, isOriginAllowed: ssoIsOriginAllowed } = ssoCorsModule;

const flashcardCorsModule = await import(`file://${rootDir}/flashcard/apps/api/dist/middlewares/cors.js`);
const { corsSecurityMiddleware: flashcardCors, isOriginAllowed: flashcardIsOriginAllowed } = flashcardCorsModule;

const shopCorsModule = await import(`file://${rootDir}/shop/app/api/dist/middlewares/corsGuard.js`);
const { corsGuardMiddleware: shopCors, isOriginAllowed: shopIsOriginAllowed } = shopCorsModule;

console.log('===============================================================');
console.log('🛡️ HUY TUTOR - CLI & CORS SECURITY GUARD TEST SUITE');
console.log('===============================================================\n');

let totalTests = 0;
let passedTests = 0;

function createMockRes() {
  const headers = {};
  const res = {
    statusCode: 200,
    headers,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    setHeader(k, v) {
      headers[k.toLowerCase()] = v;
      return this;
    },
    end() {
      this.ended = true;
      return this;
    }
  };
  return res;
}

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

// ─── 1. SSO API CLI & CORS Guard ──────────────────────────────────────────────
console.log('📦 MODULE 1: SSO API Security Guard');

runTest('1.1 SSO blocks curl user-agent with 403 Forbidden', () => {
  const req = { path: '/api/auth/me', headers: { 'user-agent': 'curl/8.5.0' } };
  const res = createMockRes();
  let nextCalled = false;
  ssoCors(req, res, () => { nextCalled = true; });

  assert.strictEqual(res.statusCode, 403);
  assert.strictEqual(res.body?.error?.code, 'CLI_ACCESS_FORBIDDEN');
  assert.strictEqual(nextCalled, false);
});

runTest('1.2 SSO blocks python-requests with 403 Forbidden', () => {
  const req = { path: '/api/auth/login', headers: { 'user-agent': 'python-requests/2.31.0' } };
  const res = createMockRes();
  let nextCalled = false;
  ssoCors(req, res, () => { nextCalled = true; });

  assert.strictEqual(res.statusCode, 403);
  assert.strictEqual(res.body?.error?.code, 'CLI_ACCESS_FORBIDDEN');
  assert.strictEqual(nextCalled, false);
});

runTest('1.3 SSO blocks unauthorized Origin with 403 Forbidden', () => {
  const req = { path: '/api/auth/me', headers: { origin: 'https://evil-attacker.com', 'user-agent': 'Mozilla/5.0' } };
  const res = createMockRes();
  let nextCalled = false;
  ssoCors(req, res, () => { nextCalled = true; });

  assert.strictEqual(res.statusCode, 403);
  assert.strictEqual(res.body?.error?.code, 'CORS_ORIGIN_DENIED');
  assert.strictEqual(nextCalled, false);
});

runTest('1.4 SSO allows legitimate browser requests and sets CORS headers', () => {
  const req = { path: '/api/auth/me', headers: { origin: 'https://sso.huytutor.edu.vn', 'user-agent': 'Mozilla/5.0 Chrome/120' } };
  const res = createMockRes();
  let nextCalled = false;
  ssoCors(req, res, () => { nextCalled = true; });

  assert.strictEqual(nextCalled, true);
  assert.strictEqual(res.headers['access-control-allow-origin'], 'https://sso.huytutor.edu.vn');
  assert.strictEqual(res.headers['access-control-allow-credentials'], 'true');
});

runTest('1.5 SSO exempts /health endpoint for Render uptime monitor', () => {
  const req = { path: '/health', headers: { 'user-agent': 'Render/1.0' } };
  const res = createMockRes();
  let nextCalled = false;
  ssoCors(req, res, () => { nextCalled = true; });

  assert.strictEqual(nextCalled, true);
});

// ─── 2. FLASHCARD API CLI & CORS Guard ────────────────────────────────────────
console.log('\n📦 MODULE 2: FLASHCARD API Security Guard');

runTest('2.1 Flashcard blocks curl user-agent with 403 Forbidden', () => {
  const req = { path: '/admin/users', headers: { 'user-agent': 'curl/7.88.1' } };
  const res = createMockRes();
  let nextCalled = false;
  flashcardCors(req, res, () => { nextCalled = true; });

  assert.strictEqual(res.statusCode, 403);
  assert.strictEqual(res.body?.error?.code, 'CLI_ACCESS_FORBIDDEN');
  assert.strictEqual(nextCalled, false);
});

runTest('2.2 Flashcard blocks unauthorized Origin with 403 Forbidden', () => {
  const req = { path: '/game/vocab', headers: { origin: 'https://phishing-site.xyz', 'user-agent': 'Mozilla/5.0' } };
  const res = createMockRes();
  let nextCalled = false;
  flashcardCors(req, res, () => { nextCalled = true; });

  assert.strictEqual(res.statusCode, 403);
  assert.strictEqual(res.body?.error?.code, 'CORS_ORIGIN_DENIED');
  assert.strictEqual(nextCalled, false);
});

runTest('2.3 Flashcard allows valid flashcard.huytutor.edu.vn origin', () => {
  const req = { path: '/decks', headers: { origin: 'https://flashcard.huytutor.edu.vn', 'user-agent': 'Mozilla/5.0' } };
  const res = createMockRes();
  let nextCalled = false;
  flashcardCors(req, res, () => { nextCalled = true; });

  assert.strictEqual(nextCalled, true);
  assert.strictEqual(res.headers['access-control-allow-origin'], 'https://flashcard.huytutor.edu.vn');
});

runTest('2.4 Flashcard exempts /api/health for Render monitoring', () => {
  const req = { path: '/api/health', headers: { 'user-agent': 'UptimeRobot/2.0' } };
  const res = createMockRes();
  let nextCalled = false;
  flashcardCors(req, res, () => { nextCalled = true; });

  assert.strictEqual(nextCalled, true);
});

// ─── 3. SHOP API CLI & CORS Guard ─────────────────────────────────────────────
console.log('\n📦 MODULE 3: SHOP API Security Guard');

runTest('3.1 Shop blocks curl user-agent with 403 Forbidden', () => {
  const req = { path: '/api/admin/products', headers: { 'user-agent': 'curl/8.0.0' } };
  const res = createMockRes();
  let nextCalled = false;
  shopCors(req, res, () => { nextCalled = true; });

  assert.strictEqual(res.statusCode, 403);
  assert.strictEqual(nextCalled, false);
});

runTest('3.2 Shop blocks unauthorized Origin with 403 Forbidden', () => {
  const req = { path: '/api/orders', headers: { origin: 'https://fake-huytutor.com', 'user-agent': 'Mozilla/5.0' } };
  const res = createMockRes();
  let nextCalled = false;
  shopCors(req, res, () => { nextCalled = true; });

  assert.strictEqual(res.statusCode, 403);
  assert.strictEqual(nextCalled, false);
});

runTest('3.3 Shop allows official huytutor.edu.vn origin', () => {
  const req = { path: '/api/catalog/products', headers: { origin: 'https://huytutor.edu.vn', 'user-agent': 'Mozilla/5.0' } };
  const res = createMockRes();
  let nextCalled = false;
  shopCors(req, res, () => { nextCalled = true; });

  assert.strictEqual(nextCalled, true);
  assert.strictEqual(res.headers['access-control-allow-origin'], 'https://huytutor.edu.vn');
});

runTest('3.4 Shop exempts banking webhook callbacks (SePay / PayPal)', () => {
  const req = { path: '/api/webhook/sepay', headers: { 'user-agent': 'SePay-Webhook-Client' } };
  const res = createMockRes();
  let nextCalled = false;
  shopCors(req, res, () => { nextCalled = true; });

  assert.strictEqual(nextCalled, true);
});

runTest('3.5 Shop exempts /health endpoint', () => {
  const req = { path: '/health', headers: { 'user-agent': 'curl/7.88.1' } };
  const res = createMockRes();
  let nextCalled = false;
  shopCors(req, res, () => { nextCalled = true; });

  assert.strictEqual(nextCalled, true);
});

console.log('\n===============================================================');
console.log(`🎯 SECURITY TEST RESULTS: ${passedTests}/${totalTests} PASSED (100% Target)`);
console.log('===============================================================\n');

if (passedTests === totalTests) {
  console.log('🎉 ALL CLI & CORS SECURITY GUARD TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
} else {
  console.error('💥 SOME TESTS FAILED');
  process.exit(1);
}
