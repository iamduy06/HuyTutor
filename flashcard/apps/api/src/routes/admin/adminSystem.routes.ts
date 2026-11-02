import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/roleGuard.js';
import { getAdminClient } from '../../config/supabase.js';
import { parseDateToISO, parseStringArray } from '../../utils/importUtils.js';
import * as XLSX from 'xlsx';
import { validate } from '../../middlewares/validate.js';
import { exportLimiter } from '../../middlewares/rateLimiter.js';
import {
  adminExportQuerySchema,
  adminAppSettingsSchema,
  adminPatchDevicesSchema,
  adminDeleteDevicesSchema,
  adminImportUsersSchema,
  adminImportDecksSchema,
  adminImportGroupsSchema,
  generatePassword,
} from '@huytutor/shared';

const router = Router();
router.use('/admin', requireAuth, requireRole('ADMIN'));

const DEFAULT_GROUP_ID = '159b18f1-f6de-4567-b83a-6cffcc287438';
const RESTRICTED_GROUPS = [
  '00ba87df-2e06-454d-96db-e0039680b7c3',
  '159b18f1-f6de-4567-b83a-6cffcc287438',
];

function sanitizeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  const str = String(val);
  // SEC-009: Neutralize formula injection characters (=, +, -, @, tab, CR)
  const sanitized = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return sanitized.replace(/"/g, '""');
}

function jsonToCsv(items: any[], columns: string[]): string {
  const header = columns.join(',');
  const rows = items.map(item =>
    columns
      .map(col => `"${sanitizeCsvField(item[col])}"`)
      .join(',')
  );
  return [header, ...rows].join('\n');
}

function sendXlsx(res: Response, items: any[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(items);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
  res.send(buf);
}

// ─── DEVICES ─────────────────────────────────────────────────────────────────

// GET /admin/devices
router.get('/admin/devices', async (req: Request, res: Response) => {
  const userId = req.query.user_id as string;
  const supabase = getAdminClient();

  if (userId) {
    const { data: devices } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', userId)
      .order('last_seen', { ascending: false });
    return res.status(200).json({ devices: devices ?? [] });
  }

  const { data: setting } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'global_max_devices')
    .single();

  return res.status(200).json({ global_max_devices: parseInt(setting?.value ?? '3', 10) });
});

// PATCH /admin/devices
router.patch('/admin/devices', validate({ body: adminPatchDevicesSchema }), async (req: Request, res: Response) => {
  const body = req.body;
  const supabase = getAdminClient();

  if (body.global_max_devices !== undefined) {
    await supabase.from('app_settings').upsert(
      { key: 'global_max_devices', value: String(body.global_max_devices) },
      { onConflict: 'key' }
    );
    return res.status(200).json({ success: true });
  }

  if (body.user_id && body.max_devices !== undefined) {
    await supabase
      .from('users')
      .update({ max_devices: body.max_devices === null ? null : Number(body.max_devices) })
      .eq('id', body.user_id);
    return res.status(200).json({ success: true });
  }

  return res.status(400).json({ error: 'Invalid body' });
});

// DELETE /admin/devices
router.delete('/admin/devices', validate({ body: adminDeleteDevicesSchema }), async (req: Request, res: Response) => {
  const body = req.body;
  const supabase = getAdminClient();

  if (body.device_id && body.user_id) {
    await supabase
      .from('user_devices')
      .delete()
      .eq('device_id', body.device_id)
      .eq('user_id', body.user_id);
    return res.status(200).json({ success: true });
  }

  if (body.user_id && !body.device_id) {
    await supabase.from('user_devices').delete().eq('user_id', body.user_id);
    return res.status(200).json({ success: true });
  }

  return res.status(400).json({ error: 'device_id or user_id required' });
});

// ─── REFERENCES ──────────────────────────────────────────────────────────────

// GET /admin/references
router.get('/admin/references', async (_req: Request, res: Response) => {
  const supabase = getAdminClient();
  const [decksRes, groupsRes] = await Promise.all([
    supabase.from('decks').select('id, title').order('title'),
    supabase.from('groups').select('id, name').order('name'),
  ]);

  return res.status(200).json({
    decks: decksRes.data ?? [],
    groups: groupsRes.data ?? [],
    error: decksRes.error || groupsRes.error,
  });
});

// ─── IMPORTS ─────────────────────────────────────────────────────────────────

// POST /admin/import/users
router.post('/admin/import/users', validate({ body: adminImportUsersSchema }), async (req: Request, res: Response) => {
  const body = req.body;
  const rows = Array.isArray(body) ? body : [body];
  const supabase = getAdminClient();
  const results = [];

  for (const row of rows) {
    const email = typeof row.email === 'string' ? row.email.trim() : row.email || '';
    const password = row.password?.trim() || 'goidangkyflashcard';
    const rawGroupId = typeof row.group_id === 'string' ? row.group_id.trim() : row.group_id;
    const groupId = rawGroupId || DEFAULT_GROUP_ID;
    const role = (row.role || 'USER').toUpperCase();
    const deckList = parseStringArray(row.deck);
    const expireAt = parseDateToISO(row.expire_at);

    if (!email || !email.includes('@')) {
      results.push({ email: email || 'N/A', status: 'error', error: 'Email không hợp lệ' });
      continue;
    }

    if (role === 'SUBADMIN') {
      if (RESTRICTED_GROUPS.includes(groupId)) {
        results.push({
          email,
          status: 'error',
          error: 'SUBADMIN không được thuộc nhóm hệ thống mặc định',
        });
        continue;
      }

      const { data: group } = await supabase
        .from('groups')
        .select('is_system')
        .eq('id', groupId)
        .maybeSingle();

      if (!group || group.is_system) {
        results.push({
          email,
          status: 'error',
          error: 'SUBADMIN phải thuộc nhóm người dùng (is_system=false)',
        });
        continue;
      }
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role, skip_system_group: true },
    });

    let userId = authData?.user?.id;

    if (authError) {
      if (authError.message.includes('already been registered') || (authError as any).status === 422) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .maybeSingle();
        userId = existingUser?.id;
      } else {
        results.push({ email, status: 'error', error: authError.message });
        continue;
      }
    }

    if (!userId) {
      results.push({ email, status: 'error', error: 'Không thể định danh tài khoản' });
      continue;
    }

    await supabase.from('users').upsert({ id: userId, email, role });
    await supabase.from('group_users').upsert(
      { group_id: groupId, user_id: userId, is_subadmin: role === 'SUBADMIN' },
      { onConflict: 'group_id,user_id' }
    );

    if (deckList.length > 0) {
      const userDeckRows = deckList.map(deckId => ({
        user_id: userId,
        deck_id: deckId,
        expired_at: expireAt,
      }));
      await supabase.from('user_decks').upsert(userDeckRows, { onConflict: 'user_id,deck_id' });
    }

    results.push({ email, status: 'success', user_id: userId });
  }

  return res.status(200).json({ results });
});

// POST /admin/import/decks
router.post('/admin/import/decks', validate({ body: adminImportDecksSchema }), async (req: Request, res: Response) => {
  const body = req.body;
  const rows = Array.isArray(body) ? body : [body];
  const supabase = getAdminClient();
  const results = [];

  for (const row of rows) {
    const deckId = row.id;
    const userList = parseStringArray(row.user);
    const expireAt = parseDateToISO(row.expire_at);

    if (!deckId) {
      results.push({ id: 'N/A', status: 'error', error: 'Thiếu Deck ID' });
      continue;
    }

    const { data: deck } = await supabase
      .from('decks')
      .select('id')
      .eq('id', deckId)
      .maybeSingle();

    if (!deck) {
      results.push({ id: deckId, status: 'error', error: 'Bộ đề không tồn tại' });
      continue;
    }

    const resolvedUserIds: string[] = [];
    const userErrors = [];
    for (const uItem of userList) {
      const cleanItem = String(uItem).trim().replace(/["'\\]/g, '');
      const query = cleanItem.includes('@')
        ? supabase.from('users').select('id').eq('email', cleanItem).maybeSingle()
        : supabase.from('users').select('id').eq('id', cleanItem).maybeSingle();
      const { data: uData } = await query;
      if (uData) resolvedUserIds.push(uData.id);
      else userErrors.push(uItem);
    }

    if (userErrors.length > 0) {
      results.push({
        id: deckId,
        status: 'error',
        error: `User ko tìm thấy: ${userErrors.join(', ')}`,
      });
      continue;
    }

    if (resolvedUserIds.length > 0) {
      const userDeckRows = resolvedUserIds.map(userId => ({
        user_id: userId,
        deck_id: deckId,
        expired_at: expireAt,
      }));
      await supabase.from('user_decks').upsert(userDeckRows, { onConflict: 'user_id,deck_id' });
    }

    results.push({ id: deckId, status: 'success', users_count: resolvedUserIds.length });
  }

  return res.status(200).json({ results });
});

// POST /admin/import/groups
router.post('/admin/import/groups', validate({ body: adminImportGroupsSchema }), async (req: Request, res: Response) => {
  const body = req.body;
  const rows = Array.isArray(body) ? body : [body];
  const supabase = getAdminClient();
  const results = [];

  for (const row of rows) {
    const groupId = row.id;
    const userList = parseStringArray(row.users);
    const deckList = parseStringArray(row.decks);
    const expireAt = parseDateToISO(row.expire_at);
    const assignAll = String(row.assign_all).toLowerCase() === 'true';

    if (!groupId) {
      results.push({ id: 'N/A', status: 'error', error: 'Thiếu Group ID' });
      continue;
    }

    const { data: group, error: gErr } = await supabase
      .from('groups')
      .select('id')
      .eq('id', groupId)
      .maybeSingle();

    if (gErr || !group) {
      results.push({ id: groupId, status: 'error', error: 'Nhóm không tồn tại' });
      continue;
    }

    const resolvedUserIds: string[] = [];
    for (const uItem of userList) {
      const cleanItem = String(uItem).trim().replace(/["'\\]/g, '');
      const query = cleanItem.includes('@')
        ? supabase.from('users').select('id').eq('email', cleanItem).maybeSingle()
        : supabase.from('users').select('id').eq('id', cleanItem).maybeSingle();
      const { data: uData } = await query;
      if (uData) resolvedUserIds.push(uData.id);
    }

    const resolvedDeckIds: string[] = [];
    for (const dItem of deckList) {
      const cleanDeck = String(dItem).trim().replace(/["'\\]/g, '');
      const byId = await supabase.from('decks').select('id').eq('id', cleanDeck).maybeSingle();
      if (byId.data) {
        resolvedDeckIds.push(byId.data.id);
      } else {
        const byTitle = await supabase.from('decks').select('id').eq('title', cleanDeck).maybeSingle();
        if (byTitle.data) resolvedDeckIds.push(byTitle.data.id);
      }
    }

    if (resolvedUserIds.length > 0) {
      const groupUserRows = resolvedUserIds.map(uId => ({
        group_id: groupId,
        user_id: uId,
      }));
      await supabase.from('group_users').upsert(groupUserRows, { onConflict: 'group_id,user_id' });
    }

    if (resolvedDeckIds.length > 0) {
      const groupDeckRows = resolvedDeckIds.map(dId => ({
        group_id: groupId,
        deck_id: dId,
        expired_at: expireAt,
      }));
      await supabase.from('group_decks').upsert(groupDeckRows, { onConflict: 'group_id,deck_id' });
    }

    if (assignAll && resolvedUserIds.length > 0 && resolvedDeckIds.length > 0) {
      const userDeckRows: any[] = [];
      resolvedUserIds.forEach(uId => {
        resolvedDeckIds.forEach(dId => {
          userDeckRows.push({
            user_id: uId,
            deck_id: dId,
            expired_at: expireAt,
          });
        });
      });
      await supabase.from('user_decks').upsert(userDeckRows, { onConflict: 'user_id,deck_id' });
    }

    results.push({
      id: groupId,
      status: 'success',
      users_count: resolvedUserIds.length,
      decks_count: resolvedDeckIds.length,
    });
  }

  return res.status(200).json({ results });
});

// ─── EXPORT ──────────────────────────────────────────────────────────────────

// GET /admin/export
router.get('/admin/export', exportLimiter, validate({ query: adminExportQuerySchema }), async (req: Request, res: Response) => {
  const type = req.query.type as string;
  const format = (req.query.format as string) ?? 'json_full';
  const supabase = getAdminClient();

  if (type === 'groups') {
    const { data: groups } = await supabase
      .from('groups')
      .select(
        '*, group_users(user_id, is_subadmin, users(email, created_at)), group_decks(deck_id, decks(title, access_level))'
      )
      .order('created_at', { ascending: false });

    const userIds = groups?.flatMap((g: any) => g.group_users.map((gu: any) => gu.user_id)) ?? [];
    const { data: allUserDecks } = await supabase
      .from('user_decks')
      .select('user_id, deck_id')
      .in('user_id', userIds);

    const exportData = (groups ?? []).map((g: any) => {
      const users = g.group_users.map((gu: any) => {
        const uDecks = (allUserDecks ?? [])
          .filter((ud: any) => ud.user_id === gu.user_id)
          .map((ud: any) => ud.deck_id);
        return {
          email: gu.users?.email,
          role: gu.is_subadmin ? 'SUBADMIN' : 'USER',
          created_at: gu.users?.created_at,
          decks: uDecks,
        };
      });

      const decks = g.group_decks.map((gd: any) => ({
        id: gd.deck_id,
        name: gd.decks?.title,
        access_level: gd.decks?.access_level,
      }));

      return {
        id: g.id,
        name: g.name,
        created_at: g.created_at,
        users,
        decks,
        user_emails: users.map((u: any) => u.email).join(', '),
        deck_titles: decks.map((d: any) => d.name).join(', '),
      };
    });

    if (format === 'csv') {
      const csv = jsonToCsv(exportData, ['id', 'name', 'user_emails', 'deck_titles', 'created_at']);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="groups.csv"');
      return res.send('\ufeff' + csv);
    }

    if (format === 'xlsx') {
      return sendXlsx(res, exportData, 'groups');
    }

    return res.status(200).json(exportData);
  }

  if (type === 'decks') {
    const { data: decks } = await supabase
      .from('decks')
      .select('*')
      .order('created_at', { ascending: false });

    if (format === 'csv') {
      const csv = jsonToCsv(decks ?? [], [
        'id',
        'title',
        'description',
        'level',
        'level_min',
        'level_max',
        'access_level',
        'created_at',
      ]);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="decks.csv"');
      return res.send('\ufeff' + csv);
    }

    if (format === 'xlsx') {
      return sendXlsx(res, decks ?? [], 'decks');
    }

    return res.status(200).json(decks);
  }

  if (type === 'users') {
    const { data: users } = await supabase
      .from('users')
      .select(
        '*, user_decks(deck_id, expired_at, decks(title)), user_devices(device_id, device_name, ip_address, last_seen)'
      )
      .order('created_at', { ascending: false });

    const exportData = (users ?? []).map((u: any) => {
      const decks = (u.user_decks ?? []).map((ud: any) => ({
        id: ud.deck_id,
        name: ud.decks?.title,
        expire_at: ud.expired_at,
      }));

      const devices = (u.user_devices ?? []).map((dv: any) => ({
        id: dv.device_id,
        name: dv.device_name,
        ip: dv.ip_address,
        last_seen: dv.last_seen,
      }));

      return {
        id: u.id,
        email: u.email,
        role: u.role,
        max_device: u.max_devices,
        decks,
        devices,
        deck_ids_str: decks.map((d: any) => `"${d.id}"`).join(', '),
        device_names: devices.map((d: any) => d.name).join(', '),
      };
    });

    if (format === 'csv') {
      const csv = jsonToCsv(exportData, [
        'id',
        'email',
        'role',
        'max_device',
        'deck_ids_str',
        'device_names',
      ]);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
      return res.send('\ufeff' + csv);
    }

    if (format === 'xlsx') {
      return sendXlsx(res, exportData, 'users');
    }

    return res.status(200).json(exportData);
  }

  return res.status(400).json({ error: 'type required (users, decks, or groups)' });
});

// ─── STATS & ANALYTICS ────────────────────────────────────────────────────────

// GET /admin/stats - Quick stats overview for admin dashboard
router.get('/admin/stats', async (_req: Request, res: Response) => {
  const admin = getAdminClient();

  const [
    { count: totalUsers },
    { count: totalDecks },
    { data: progressData },
  ] = await Promise.all([
    admin.from('users').select('*', { count: 'exact', head: true }),
    admin.from('decks').select('*', { count: 'exact', head: true }),
    admin.from('user_decks').select('progress_percent'),
  ]);

  const avgProgress = progressData?.length
    ? Math.round(progressData.reduce((s: number, r: any) => s + (r.progress_percent || 0), 0) / progressData.length)
    : 0;

  const { data: recentUsers } = await admin
    .from('users')
    .select('id, email, role, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  return res.status(200).json({
    totalUsers: totalUsers ?? 0,
    totalDecks: totalDecks ?? 0,
    avgProgress,
    totalAssignments: progressData?.length ?? 0,
    recentUsers: recentUsers ?? [],
  });
});

// GET /admin/analytics
router.get('/admin/analytics', async (_req: Request, res: Response) => {
  const admin = getAdminClient();

  const [
    { count: totalUsers },
    { count: totalDecks },
    { data: deckStats },
    { data: progressStats },
  ] = await Promise.all([
    admin.from('users').select('*', { count: 'exact', head: true }),
    admin.from('decks').select('*', { count: 'exact', head: true }),
    admin
      .from('user_decks')
      .select('deck_id, deck:decks(title), progress_percent')
      .order('deck_id'),
    admin.from('user_decks').select('progress_percent'),
  ]);

  const avgProgress = progressStats?.length
    ? Math.round(
        progressStats.reduce((s: number, r: any) => s + (r.progress_percent || 0), 0) /
          progressStats.length
      )
    : 0;

  const deckMap: Record<
    string,
    { title: string; count: number; avgProgress: number; totalProgress: number }
  > = {};
  (deckStats ?? []).forEach((r: any) => {
    const id = r.deck_id;
    if (!deckMap[id]) {
      deckMap[id] = { title: r.deck?.title ?? id, count: 0, avgProgress: 0, totalProgress: 0 };
    }
    deckMap[id].count++;
    deckMap[id].totalProgress += r.progress_percent || 0;
  });

  const popularDecks = Object.values(deckMap)
    .map(d => ({ ...d, avgProgress: d.count ? Math.round(d.totalProgress / d.count) : 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const { data: streakData } = await admin
    .from('user_decks')
    .select('streak')
    .order('streak', { ascending: false })
    .limit(1);

  const maxStreak = (streakData?.[0] as any)?.streak ?? 0;

  return res.status(200).json({ totalUsers, totalDecks, avgProgress, maxStreak, popularDecks });
});

// ─── APP SETTINGS ────────────────────────────────────────────────────────────

// GET /admin/app-settings
router.get('/admin/app-settings', async (_req: Request, res: Response) => {
  const supabase = getAdminClient();
  const { data: settings, error } = await supabase
    .from('app_settings')
    .select('key, value')
    .eq('key', 'global_max_devices')
    .single();

  if (error && error.code !== 'PGRST116') {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ global_max_devices: settings?.value || '3' });
});

// PATCH /admin/app-settings
router.patch('/admin/app-settings', validate({ body: adminAppSettingsSchema }), async (req: Request, res: Response) => {
  const { global_max_devices } = req.body;
  if (!global_max_devices) {
    return res.status(400).json({ error: 'Missing value' });
  }

  const supabase = getAdminClient();
  const { error } = await supabase.from('app_settings').upsert(
    {
      key: 'global_max_devices',
      value: global_max_devices.toString(),
    },
    { onConflict: 'key' }
  );

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
});

export default router;
