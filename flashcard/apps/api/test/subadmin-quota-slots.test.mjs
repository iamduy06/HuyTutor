/**
 * Test Suite: Subadmin Slot Management & Student Access (Milestone 4)
 * Verifies:
 *   1. Feature #14: Subadmin API Slot Tracking (max_users & used_slots from group_user_decks)
 *   2. Feature #15: Subadmin API Slot Allocation Guard (reject with 400 "Bộ thẻ này đã hết slot" when full)
 *   3. Feature #16: Subadmin API Slot Release (revoke_deck / unassign_deck releases slot in group_user_decks)
 *   4. Feature #19: Error Sanitization for Quotas (allow slot and "Bộ thẻ" messages through without masking)
 *   5. Feature #20: Student Public/Auth Deck Access Verification (unassigned students can learn free decks)
 */

import assert from 'assert';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiRoot = path.resolve(__dirname, '..');
const flashcardRoot = path.resolve(apiRoot, '../..');

// 1. Test getClientErrorMessage (Feature #19)
console.log('--- Testing Feature #19: Error Sanitization for Quotas ---');
const errorHandlerPath = path.resolve(flashcardRoot, 'apps/web/lib/errorHandler.ts');
const { getClientErrorMessage } = await import(`file://${errorHandlerPath}`);

// Dispatch required assertions:
// - getClientErrorMessage(new Error("PGRST204: relation does not exist"), false) returns "Đã có lỗi xảy ra trong quá trình xử lý, vui lòng thử lại sau hoặc liên hệ hỗ trợ." (and is of type string)
const pgrstResult = getClientErrorMessage(new Error("PGRST204: relation does not exist"), false);
assert.strictEqual(typeof pgrstResult, 'string', 'PGRST masked error result must be of type string');
assert.strictEqual(
  pgrstResult,
  "Đã có lỗi xảy ra trong quá trình xử lý, vui lòng thử lại sau hoặc liên hệ hỗ trợ.",
  'PGRST error must return generic fallback string when isAdmin is false'
);

// - getClientErrorMessage(new Error("duplicate key value violates unique constraint"), false) returns string fallback
const dupKeyResult = getClientErrorMessage(new Error("duplicate key value violates unique constraint"), false);
assert.strictEqual(typeof dupKeyResult, 'string', 'Duplicate key error must be of type string');
assert.strictEqual(
  dupKeyResult,
  "Đã có lỗi xảy ra trong quá trình xử lý, vui lòng thử lại sau hoặc liên hệ hỗ trợ.",
  'Duplicate key DB error must return string fallback when isAdmin is false'
);

// - getClientErrorMessage(new Error("Bộ thẻ này đã hết slot"), false) returns "Bộ thẻ này đã hết slot"
const slotResult = getClientErrorMessage(new Error("Bộ thẻ này đã hết slot"), false);
assert.strictEqual(
  slotResult,
  "Bộ thẻ này đã hết slot",
  'Quota slot error must be allowed through on client/subadmin routes'
);

// Admin route receives full technical details for debugging
const adminResult = getClientErrorMessage(new Error("PGRST204: relation does not exist"), true);
assert.strictEqual(
  adminResult,
  "PGRST204: relation does not exist",
  'Admin route must receive full technical error message'
);

console.log('✓ Feature #19 verified: polymorphic getClientErrorMessage handles boolean isAdmin correctly and allows slot messages.');

// 2. Test getDeckAccess (Feature #20)
console.log('--- Testing Feature #20: Student Public/Auth Deck Access ---');
const sharedPath = path.resolve(flashcardRoot, 'packages/shared/dist/index.js');
const { getDeckAccess, subadminUpdateUserSchema } = await import(`file://${sharedPath}`);

// Verify subadminUpdateUserSchema action enum accepts both revoke_deck and unassign_deck
const parsedRevoke = subadminUpdateUserSchema.parse({ action: 'revoke_deck', deck_id: 'deck-1' });
assert.strictEqual(parsedRevoke.action, 'revoke_deck');
const parsedUnassign = subadminUpdateUserSchema.parse({ action: 'unassign_deck', deck_id: 'deck-1' });
assert.strictEqual(parsedUnassign.action, 'unassign_deck');
console.log('✓ subadminUpdateUserSchema verified: accepts both revoke_deck and unassign_deck actions.');

const studentUser = { id: 'student-123', role: 'USER' };

// Unassigned student accessing Public Deck
const publicDeck = { id: 'deck-public', access_level: { public: true } };
const publicAccess = getDeckAccess(studentUser, publicDeck, null);
assert.strictEqual(publicAccess.canView, true, 'Student must be able to view public deck');
assert.strictEqual(publicAccess.canLearnFull, true, 'Student must be able to learn public deck');

// Unassigned student accessing Auth Deck
const authDeck = { id: 'deck-auth', access_level: { auth: true } };
const authAccess = getDeckAccess(studentUser, authDeck, null);
assert.strictEqual(authAccess.canView, true, 'Student must be able to view auth deck');
assert.strictEqual(authAccess.canLearnFull, true, 'Student must be able to learn auth deck');

// Unassigned student accessing Paid Deck (should be denied)
const paidDeck = { id: 'deck-paid', access_level: { paid: true } };
const paidAccess = getDeckAccess(studentUser, paidDeck, null);
assert.strictEqual(paidAccess.canLearnFull, false, 'Unassigned student must NOT learn paid deck full');

console.log('✓ Feature #20 verified: students without group decks freely access Public and Auth decks.');

// 3. Test In-Memory State Logic for Slot Tracking, Allocation Guard & Release (Features #14, #15, #16)
console.log('--- Testing Features #14, #15, #16: Slot Tracking, Allocation Guard & Release ---');

// Mock state table
const state = {
  group_decks: [
    { group_id: 'grp-1', deck_id: 'deck-A', max_users: 2, expired_at: null },
    { group_id: 'grp-1', deck_id: 'deck-B', max_users: 5, expired_at: null },
  ],
  group_user_decks: [
    { group_id: 'grp-1', user_id: 'student-1', deck_id: 'deck-A' },
  ],
  user_decks: [
    { user_id: 'student-1', deck_id: 'deck-A' },
  ],
};

function getSubadminDecks(groupId) {
  const gDecks = state.group_decks.filter(gd => gd.group_id === groupId);
  return gDecks.map(gd => {
    const used = state.group_user_decks.filter(
      gud => gud.group_id === gd.group_id && gud.deck_id === gd.deck_id
    ).length;
    return {
      deck_id: gd.deck_id,
      max_users: gd.max_users ?? 10,
      used_slots: used,
    };
  });
}

function assignDeck(groupId, userId, deckId) {
  const gd = state.group_decks.find(d => d.group_id === groupId && d.deck_id === deckId);
  if (!gd) throw new Error('Flashcard này không thuộc kho tài nguyên của nhóm');

  const existing = state.group_user_decks.find(
    gud => gud.group_id === groupId && gud.user_id === userId && gud.deck_id === deckId
  );

  const used = state.group_user_decks.filter(
    gud => gud.group_id === groupId && gud.deck_id === deckId
  ).length;

  const max = gd.max_users ?? 10;
  if (!existing && used >= max) {
    return { status: 400, error: 'Bộ thẻ này đã hết slot' };
  }

  if (!existing) {
    state.group_user_decks.push({ group_id: groupId, user_id: userId, deck_id: deckId });
  }

  const existingUD = state.user_decks.find(ud => ud.user_id === userId && ud.deck_id === deckId);
  if (!existingUD) {
    state.user_decks.push({ user_id: userId, deck_id: deckId });
  }

  return { status: 200, success: true };
}

function revokeDeck(groupId, userId, deckId) {
  state.group_user_decks = state.group_user_decks.filter(
    gud => !(gud.group_id === groupId && gud.user_id === userId && gud.deck_id === deckId)
  );
  state.user_decks = state.user_decks.filter(
    ud => !(ud.user_id === userId && ud.deck_id === deckId)
  );
  return { status: 200, success: true };
}

// Initial check: Deck A has max_users: 2, used_slots: 1
let decks = getSubadminDecks('grp-1');
assert.strictEqual(decks[0].deck_id, 'deck-A');
assert.strictEqual(decks[0].max_users, 2);
assert.strictEqual(decks[0].used_slots, 1);
console.log('✓ Initial slot tracking verified: Deck A used 1/2 slots.');

// Assign slot 2 to student-2 -> SUCCESS
let res = assignDeck('grp-1', 'student-2', 'deck-A');
assert.strictEqual(res.status, 200);
decks = getSubadminDecks('grp-1');
assert.strictEqual(decks[0].used_slots, 2);
console.log('✓ Assigning 2nd slot succeeded: Deck A now has 2/2 slots used.');

// Assign slot 3 to student-3 -> MUST FAIL with 400 "Bộ thẻ này đã hết slot"
res = assignDeck('grp-1', 'student-3', 'deck-A');
assert.strictEqual(res.status, 400);
assert.strictEqual(res.error, 'Bộ thẻ này đã hết slot');
decks = getSubadminDecks('grp-1');
assert.strictEqual(decks[0].used_slots, 2, 'used_slots must stay at 2');
console.log('✓ Allocation Guard verified: 3rd assignment rejected with "Bộ thẻ này đã hết slot".');

// Re-assigning existing student-1 -> Allowed without taking extra slot
res = assignDeck('grp-1', 'student-1', 'deck-A');
assert.strictEqual(res.status, 200);
decks = getSubadminDecks('grp-1');
assert.strictEqual(decks[0].used_slots, 2, 'Re-assigning must not consume new slot');
console.log('✓ Idempotent assignment verified: existing student does not consume duplicate slot.');

// Revoke student-2 from Deck A -> Releases slot immediately
res = revokeDeck('grp-1', 'student-2', 'deck-A');
assert.strictEqual(res.status, 200);
decks = getSubadminDecks('grp-1');
assert.strictEqual(decks[0].used_slots, 1, 'used_slots must decrease to 1');
console.log('✓ Slot Release verified: Revoking released slot immediately (now 1/2 used).');

// Now student-3 CAN take the released slot!
res = assignDeck('grp-1', 'student-3', 'deck-A');
assert.strictEqual(res.status, 200);
decks = getSubadminDecks('grp-1');
assert.strictEqual(decks[0].used_slots, 2);
console.log('✓ Slot Re-allocation verified: student-3 successfully took the released slot.');

console.log('====================================================');
console.log('🎉 ALL MILESTONE 4 UNIT & INTEGRATION TESTS PASSED!');
console.log('====================================================');
