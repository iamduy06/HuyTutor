import fs from 'fs';
import path from 'path';

const NEW_SUPABASE_URL = process.env.NEW_SUPABASE_URL;
const NEW_SERVICE_KEY = process.env.NEW_SERVICE_KEY;

const BACKUP_DIR = path.resolve('d:/HUY TUTOR/HuyTutor/migration_backup');

async function insertBatch(tableName, rows, batchSize = 100) {
  console.log(`Inserting ${rows.length} rows into [${tableName}] in batches of ${batchSize}...`);
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    const res = await fetch(`${NEW_SUPABASE_URL}/rest/v1/${tableName}`, {
      method: 'POST',
      headers: {
        'apikey': NEW_SERVICE_KEY,
        'Authorization': `Bearer ${NEW_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(chunk)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to insert into ${tableName} at batch ${i}-${i + chunk.length}: ${res.status} ${errText}`);
    }
    process.stdout.write(`  [${tableName}] Progress: ${Math.min(i + batchSize, rows.length)} / ${rows.length}\r`);
  }
  console.log(`\n[SUCCESS] Completed [${tableName}]: ${rows.length} rows inserted.`);
}

async function runMigration() {
  console.log('=== STARTING DATA MIGRATION TO NEW DATABASE ===');
  console.log(`Target Supabase: ${NEW_SUPABASE_URL}\n`);

  // 1. Check if public.users exists
  const checkRes = await fetch(`${NEW_SUPABASE_URL}/rest/v1/users?select=count`, {
    headers: {
      'apikey': NEW_SERVICE_KEY,
      'Authorization': `Bearer ${NEW_SERVICE_KEY}`,
      'Range': '0-0'
    }
  });

  if (!checkRes.ok) {
    console.error(`\n[ERROR] Table 'public.users' does not exist yet on ${NEW_SUPABASE_URL}.`);
    console.error(`Please run 'database/01_unified_schema.sql' in Supabase SQL Editor first, then rerun this script.\n`);
    process.exit(1);
  }

  // 2. Prepare Users Data
  console.log('--- 1. Preparing and Migrating Users ---');
  const authUsersFull = JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, 'auth_users_full_with_passwords.json'), 'utf8'));
  const tableUsers = JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, 'table_users.json'), 'utf8'));

  const tableUserMap = new Map();
  for (const tu of tableUsers) {
    tableUserMap.set(tu.id, tu);
  }

  const unifiedUsers = authUsersFull.map(u => {
    const tu = tableUserMap.get(u.id);
    const rawMeta = u.raw_user_meta_data || {};
    return {
      id: u.id,
      email: u.email,
      password_hash: u.encrypted_password, // Bcrypt hash ($2a$ / $2b$)
      role: tu?.role || (u.is_super_admin ? 'ADMIN' : 'USER'),
      max_devices: tu?.max_devices ?? null,
      full_name: rawMeta.full_name || '',
      phone: u.phone || '',
      customer_group: 'Học sinh',
      school_or_org: '',
      default_tax_cccd: '',
      default_invoice_address: '',
      is_active: !u.banned_until,
      last_login_at: u.last_sign_in_at || null,
      created_at: u.created_at || new Date().toISOString(),
      updated_at: u.updated_at || new Date().toISOString()
    };
  });

  await insertBatch('users', unifiedUsers, 50);

  // 3. Migrate App Settings
  console.log('\n--- 2. Migrating App Settings ---');
  const appSettings = JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, 'table_app_settings.json'), 'utf8'));
  await insertBatch('app_settings', appSettings);

  // 4. Migrate Deck Groups
  console.log('\n--- 3. Migrating Deck Groups ---');
  const deckGroups = JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, 'table_deck_groups.json'), 'utf8'));
  await insertBatch('deck_groups', deckGroups);

  // 5. Migrate Decks
  console.log('\n--- 4. Migrating Decks ---');
  const decks = JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, 'table_decks.json'), 'utf8'));
  await insertBatch('decks', decks);

  // 6. Migrate Flashcards
  console.log('\n--- 5. Migrating Flashcards (22.5 MB) ---');
  const flashcards = JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, 'table_flashcards.json'), 'utf8'));
  await insertBatch('flashcards', flashcards, 5); // smaller batch for large jsonb

  // 7. Migrate Groups
  console.log('\n--- 6. Migrating Groups ---');
  const groups = JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, 'table_groups.json'), 'utf8'));
  await insertBatch('groups', groups);

  // 8. Migrate Group Users
  console.log('\n--- 7. Migrating Group Users ---');
  const groupUsers = JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, 'table_group_users.json'), 'utf8'));
  await insertBatch('group_users', groupUsers, 100);

  // 9. Migrate Group Decks
  console.log('\n--- 8. Migrating Group Decks ---');
  const groupDecks = JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, 'table_group_decks.json'), 'utf8'));
  await insertBatch('group_decks', groupDecks, 100);

  // 10. Migrate User Decks (Progress)
  console.log('\n--- 9. Migrating User Decks (Study Progress) ---');
  const userDecks = JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, 'table_user_decks.json'), 'utf8'));
  await insertBatch('user_decks', userDecks, 200);

  // 11. Migrate User Devices
  console.log('\n--- 10. Migrating User Devices (Hardware Bindings) ---');
  const userDevices = JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, 'table_user_devices.json'), 'utf8'));
  await insertBatch('user_devices', userDevices, 100);

  console.log('\n======================================================');
  console.log('🎉 TOÀN BỘ DỮ LIỆU ĐÃ ĐƯỢC CHUYỂN THÀNH CÔNG VÀO DB MỚI!');
  console.log('======================================================');
}

runMigration().catch(err => {
  console.error('\n[FATAL ERROR]', err.message);
  process.exit(1);
});

