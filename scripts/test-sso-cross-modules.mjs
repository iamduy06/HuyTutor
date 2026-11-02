/**
 * Comprehensive Cross-Module SSO Integration Test Suite
 * Validates interoperability between:
 * - sso/api (Token Generation, JWT Sign, HMAC SHA-256)
 * - flashcard/apps/api (JWT Verification, Device Quota, Role Handling)
 * - shop/app/api (Token Extraction from Header & Cookie, Role Mapping, Admin Guard)
 * - shop/app/web (API Client credentials & Session Sync)
 */

import assert from 'assert';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Shared Test Secret
const TEST_JWT_SECRET = 'sso_super_secret_jwt_key_test_1234567890!';
const TEST_ADMIN_SECRET = 'huytutor_admin_api_secret_test_xyz!';
process.env.JWT_SECRET = TEST_JWT_SECRET;
process.env.ADMIN_API_SECRET = TEST_ADMIN_SECRET;

console.log('===============================================================');
console.log('🚀 HUY TUTOR - CROSS-MODULE SSO INTEGRATION TEST SUITE');
console.log('===============================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    if (err.stack) {
      console.error(`     ${err.stack.split('\n').slice(1, 3).join('\n    ')}`);
    }
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    if (err.stack) {
      console.error(`     ${err.stack.split('\n').slice(1, 3).join('\n    ')}`);
    }
  }
}

// ----------------------------------------------------------------------------
// Helpers: Flashcard & Shop JWT Verifiers
// ----------------------------------------------------------------------------
function verifyFlashcardSsoJwt(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');
    if (sigB64 !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// ----------------------------------------------------------------------------
// Module 1: SSO API Token Generation & Signatures
// ----------------------------------------------------------------------------
console.log('📦 MODULE 1: SSO API (Minting & Signature Verification)');

// Import Shop JWT utility from compiled dist
const shopJwt = await import(`file://${rootDir}/shop/app/api/dist/utils/jwt.js`);
const { signSsoJwt, verifySsoJwt: verifyShopSsoJwt } = shopJwt;

let sampleAdminToken = '';
let sampleUserToken = '';

runTest('1.1 SSO generates valid HS256 JWT with correct claims', () => {
  sampleAdminToken = signSsoJwt(
    {
      sub: 'usr_admin_001',
      email: 'admin@huytutor.edu.vn',
      role: 'ADMIN',
      device_id: 'dev_macbook_pro_01',
    },
    TEST_JWT_SECRET,
    3600
  );
  assert(sampleAdminToken && sampleAdminToken.split('.').length === 3, 'Token must be a 3-part JWT');

  sampleUserToken = signSsoJwt(
    {
      sub: 'usr_student_002',
      email: 'student@huytutor.edu.vn',
      role: 'USER',
      device_id: 'dev_iphone_15_02',
    },
    TEST_JWT_SECRET,
    3600
  );
  assert(sampleUserToken && sampleUserToken.split('.').length === 3, 'User token must be a 3-part JWT');
});

runTest('1.2 SSO token verification succeeds with correct secret', () => {
  const verified = verifyShopSsoJwt(sampleAdminToken, TEST_JWT_SECRET);
  assert(verified, 'Verification should return payload');
  assert.strictEqual(verified.sub, 'usr_admin_001');
  assert.strictEqual(verified.email, 'admin@huytutor.edu.vn');
  assert.strictEqual(verified.role, 'ADMIN');
  assert.strictEqual(verified.device_id, 'dev_macbook_pro_01');
});

runTest('1.3 SSO token rejects tampered payload or signature', () => {
  const parts = sampleAdminToken.split('.');
  const tampered = `${parts[0]}.${parts[1]}.invalidSignatureBase64url`;
  const result = verifyShopSsoJwt(tampered, TEST_JWT_SECRET);
  assert.strictEqual(result, null, 'Tampered token must be rejected');
});

runTest('1.4 SSO token rejects incorrect secret', () => {
  const result = verifyShopSsoJwt(sampleAdminToken, 'wrong_jwt_secret_999999!');
  assert.strictEqual(result, null, 'Wrong secret must fail verification');
});

runTest('1.5 SSO token rejects expired tokens', () => {
  const expiredToken = signSsoJwt(
    {
      sub: 'usr_expired_003',
      email: 'expired@huytutor.edu.vn',
      role: 'USER',
    },
    TEST_JWT_SECRET,
    -10 // Expired 10 seconds ago
  );
  const result = verifyShopSsoJwt(expiredToken, TEST_JWT_SECRET);
  assert.strictEqual(result, null, 'Expired token must return null');
});

// ----------------------------------------------------------------------------
// Module 2: Flashcard API SSO Interoperability
// ----------------------------------------------------------------------------
console.log('\n📦 MODULE 2: FLASHCARD API (SSO Token Validation & Quota)');

runTest('2.1 Flashcard auth successfully verifies SSO Admin token', () => {
  const payload = verifyFlashcardSsoJwt(sampleAdminToken, TEST_JWT_SECRET);
  assert(payload, 'Flashcard must verify SSO token');
  assert.strictEqual(payload.sub, 'usr_admin_001');
  assert.strictEqual(payload.role, 'ADMIN');
  assert.strictEqual(payload.device_id, 'dev_macbook_pro_01');
});

runTest('2.2 Flashcard auth successfully verifies SSO User token', () => {
  const payload = verifyFlashcardSsoJwt(sampleUserToken, TEST_JWT_SECRET);
  assert(payload, 'Flashcard must verify User SSO token');
  assert.strictEqual(payload.sub, 'usr_student_002');
  assert.strictEqual(payload.role, 'USER');
});

runTest('2.3 Flashcard rejects forged SSO token', () => {
  const parts = sampleUserToken.split('.');
  const forged = `${parts[0]}.eyJyYW5kb20iOiJib2d1cyJ9.${parts[2]}`;
  const payload = verifyFlashcardSsoJwt(forged, TEST_JWT_SECRET);
  assert.strictEqual(payload, null, 'Forged token must return null');
});

// ----------------------------------------------------------------------------
// Module 3: Shop API (Token Extraction, Session Validation & Role Mapping)
// ----------------------------------------------------------------------------
console.log('\n📦 MODULE 3: SHOP API (Token Extraction, Role Normalization & Admin Guard)');

// Import Shop middleware and auth service from compiled dist
const shopAuthMiddleware = await import(`file://${rootDir}/shop/app/api/dist/middlewares/authMiddleware.js`);
const { extractBearerToken } = shopAuthMiddleware;

const shopAdminMiddleware = await import(`file://${rootDir}/shop/app/api/dist/middlewares/adminAuth.js`);
const { adminAuthMiddleware } = shopAdminMiddleware;

const shopAuthServiceModule = await import(`file://${rootDir}/shop/app/api/dist/services/authService.js`);
const { authService, toPublicUserProfile } = shopAuthServiceModule;

runTest('3.1 extractBearerToken extracts from Authorization header (Bearer)', () => {
  const mockReq = {
    headers: { authorization: `Bearer ${sampleAdminToken}` },
  };
  const token = extractBearerToken(mockReq);
  assert.strictEqual(token, sampleAdminToken);
});

runTest('3.2 extractBearerToken extracts from custom x-session-token header', () => {
  const mockReq = {
    headers: { 'x-session-token': sampleUserToken },
  };
  const token = extractBearerToken(mockReq);
  assert.strictEqual(token, sampleUserToken);
});

runTest('3.3 extractBearerToken extracts master cookie ht_sso_token', () => {
  const mockReq = {
    headers: {
      cookie: `theme=dark; ht_sso_token=${encodeURIComponent(sampleAdminToken)}; lang=vi`,
    },
  };
  const token = extractBearerToken(mockReq);
  assert.strictEqual(token, sampleAdminToken);
});

runTest('3.4 extractBearerToken returns null when no token is present', () => {
  const mockReq = { headers: {} };
  const token = extractBearerToken(mockReq);
  assert.strictEqual(token, null);
});

runTest('3.5 toPublicUserProfile normalizes ADMIN role to admin', () => {
  const profileAdmin = toPublicUserProfile({
    id: 'u1',
    email: 'admin@huytutor.edu.vn',
    full_name: 'Admin User',
    phone: '0901234567',
    role: 'ADMIN',
    customer_group: 'Giáo viên',
    is_active: true,
  });
  assert.strictEqual(profileAdmin.role, 'admin');

  const profileUser = toPublicUserProfile({
    id: 'u2',
    email: 'user@huytutor.edu.vn',
    full_name: 'Regular User',
    phone: '',
    role: 'USER',
    customer_group: 'Học sinh',
    is_active: true,
  });
  assert.strictEqual(profileUser.role, 'user');
});

await runAsyncTest('3.6 validateSession validates SSO JWT token and builds synthetic session', async () => {
  // Mock dbService.getUserById to return user
  const dbModule = await import(`file://${rootDir}/shop/app/api/dist/services/dbService.js`);
  const originalGetUserById = dbModule.dbService.getUserById;
  dbModule.dbService.getUserById = async (id) => ({
    id,
    email: 'admin@huytutor.edu.vn',
    full_name: 'SSO Administrator',
    phone: '0912345678',
    role: 'ADMIN',
    customer_group: 'Giáo viên',
    is_active: true,
    created_at: new Date().toISOString(),
  });

  try {
    const validated = await authService.validateSession(sampleAdminToken);
    assert(validated, 'Session must be validated via SSO token');
    assert.strictEqual(validated.user.id, 'usr_admin_001');
    assert.strictEqual(validated.user.role, 'admin');
    assert.strictEqual(validated.session.id, 'sso_usr_admin_001');
    assert.strictEqual(validated.session.session_token, sampleAdminToken);
    assert.strictEqual(validated.session.is_revoked, false);
  } finally {
    dbModule.dbService.getUserById = originalGetUserById;
  }
});

await runAsyncTest('3.7 adminAuthMiddleware grants access to Admin via Cookie ht_sso_token', async () => {
  const dbModule = await import(`file://${rootDir}/shop/app/api/dist/services/dbService.js`);
  const originalGetUserById = dbModule.dbService.getUserById;
  dbModule.dbService.getUserById = async (id) => ({
    id,
    email: 'admin@huytutor.edu.vn',
    full_name: 'SSO Admin',
    role: 'ADMIN',
    is_active: true,
  });

  try {
    const mockReq = {
      headers: {
        cookie: `ht_sso_token=${sampleAdminToken}`,
      },
    };
    let nextCalled = false;
    let statusCode = null;
    let responseBody = null;
    const mockRes = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(body) {
        responseBody = body;
        return this;
      },
    };
    const mockNext = () => {
      nextCalled = true;
    };

    await adminAuthMiddleware(mockReq, mockRes, mockNext);
    assert(nextCalled, 'next() must be called for valid admin SSO session');
    assert.strictEqual(mockReq.user.role, 'admin');
  } finally {
    dbModule.dbService.getUserById = originalGetUserById;
  }
});

await runAsyncTest('3.8 adminAuthMiddleware denies access (403) to Standard User', async () => {
  const dbModule = await import(`file://${rootDir}/shop/app/api/dist/services/dbService.js`);
  const originalGetUserById = dbModule.dbService.getUserById;
  dbModule.dbService.getUserById = async (id) => ({
    id,
    email: 'student@huytutor.edu.vn',
    full_name: 'Student User',
    role: 'USER',
    is_active: true,
  });

  try {
    const mockReq = {
      headers: {
        authorization: `Bearer ${sampleUserToken}`,
      },
    };
    let nextCalled = false;
    let statusCode = null;
    let responseBody = null;
    const mockRes = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(body) {
        responseBody = body;
        return this;
      },
    };
    const mockNext = () => {
      nextCalled = true;
    };

    await adminAuthMiddleware(mockReq, mockRes, mockNext);
    assert.strictEqual(nextCalled, false, 'next() should NOT be called for standard user');
    assert.strictEqual(statusCode, 403, 'Should respond with 403 Forbidden');
    assert(responseBody?.error?.includes('Quản trị viên'), 'Error message must specify Admin Required');
  } finally {
    dbModule.dbService.getUserById = originalGetUserById;
  }
});

await runAsyncTest('3.9 adminAuthMiddleware denies unauthenticated request with 401', async () => {
  const mockReq = { headers: {} };
  let nextCalled = false;
  let statusCode = null;
  const mockRes = {
    status(code) {
      statusCode = code;
      return this;
    },
    json() {
      return this;
    },
  };
  const mockNext = () => {
    nextCalled = true;
  };

  await adminAuthMiddleware(mockReq, mockRes, mockNext);
  assert.strictEqual(nextCalled, false);
  assert.strictEqual(statusCode, 401, 'Should respond with 401 Unauthorized');
});

await runAsyncTest('3.10 adminAuthMiddleware allows emergency bypass with x-admin-key', async () => {
  const mockReq = {
    headers: { 'x-admin-key': TEST_ADMIN_SECRET },
  };
  let nextCalled = false;
  const mockRes = {};
  const mockNext = () => {
    nextCalled = true;
  };

  await adminAuthMiddleware(mockReq, mockRes, mockNext);
  assert(nextCalled, 'next() must be called for valid x-admin-key');
});

// ----------------------------------------------------------------------------
// Module 4: Environment Variables & Security Constraints
// ----------------------------------------------------------------------------
console.log('\n📦 MODULE 4: ENVIRONMENT & SECURITY CONSTRAINTS AUDIT');

runTest('4.1 Verify absence of "PUBLIC" variables in active .env.example files', async () => {
  const fs = await import('fs');
  const envFiles = [
    'shop/app/api/.env.example',
    'sso/api/.env.example',
    'flashcard/apps/api/.env.example',
    'flashcard/apps/web/.env.example',
    'sso/web/.env.example',
  ];

  for (const relPath of envFiles) {
    const fullPath = path.join(rootDir, relPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const varName = trimmed.split('=')[0];
          assert(
            !varName.includes('PUBLIC'),
            `Forbidden keyword "PUBLIC" found in ${relPath}: ${varName}`
          );
        }
      }
    }
  }
});

// ----------------------------------------------------------------------------
// Test Results Summary
// ----------------------------------------------------------------------------
console.log('\n===============================================================');
console.log(`🎯 TEST RESULTS: ${passedTests}/${totalTests} PASSED (100% Target)`);
console.log('===============================================================\n');

if (passedTests !== totalTests) {
  console.error(`❌ Some tests failed: ${totalTests - passedTests} failure(s)`);
  process.exit(1);
} else {
  console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!\n');
}
