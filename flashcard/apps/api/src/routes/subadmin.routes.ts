import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roleGuard.js';
import { getAdminClient } from '../config/supabase.js';
import { validate } from '../middlewares/validate.js';
import { memoryCache } from '../services/cacheService.js';
import { 
  generatePassword, 
  subadminCreateUserSchema, 
  subadminUpdateUserSchema, 
  subadminBrandingSchema,
  idParamSchema 
} from '@huytutor/shared';

const router = Router();

// Middleware: must be SUBADMIN or ADMIN
router.use('/subadmin', requireAuth, requireRole('SUBADMIN', 'ADMIN'));

async function canManage(me: any, targetId: string) {
  if (me.role === 'ADMIN') return true;
  if (targetId === me.id) return false;

  const admin = getAdminClient();

  // Subadmins cannot manage, modify, or delete users with ADMIN or SUBADMIN role
  const { data: targetUser } = await admin
    .from('users')
    .select('role')
    .eq('id', targetId)
    .maybeSingle();

  if (!targetUser || targetUser.role === 'ADMIN' || targetUser.role === 'SUBADMIN') {
    return false;
  }

  const { data } = await admin
    .from('group_users')
    .select('group_id')
    .eq('user_id', me.id)
    .eq('is_subadmin', true);

  const myGroupIds = (data ?? []).map(g => g.group_id);
  if (myGroupIds.length === 0) return false;

  const { data: targetInGroup } = await admin
    .from('group_users')
    .select('group_id')
    .eq('user_id', targetId)
    .in('group_id', myGroupIds)
    .limit(1)
    .maybeSingle();

  return !!targetInGroup;
}
// GET /subadmin/overview - Subadmin dashboard stats
router.get('/subadmin/overview', async (req: Request, res: Response) => {
  const me = req.user!;
  const admin = getAdminClient();

  const { data: managedGroups } = await admin
    .from('group_users')
    .select('group_id, groups(id, name, max_users, branding)')
    .eq('user_id', me.id)
    .eq('is_subadmin', true);

  const groupIds = (managedGroups ?? []).map((g: any) => g.group_id);

  if (me.role !== 'ADMIN' && groupIds.length === 0) {
    return res.status(403).json({ error: 'No managed groups' });
  }

  const { count: managedCount } = me.role === 'SUBADMIN'
    ? await admin.from('group_users').select('*', { count: 'exact', head: true }).in('group_id', groupIds)
    : await admin.from('users').select('*', { count: 'exact', head: true });

  const { data: myDecks } = me.role === 'SUBADMIN'
    ? await admin.from('group_decks').select('deck:decks(id, title)').in('group_id', groupIds)
    : await admin.from('decks').select('id, title');

  const totalMaxUsers = me.role === 'SUBADMIN'
    ? (managedGroups ?? []).reduce((acc: number, g: any) => acc + (g.groups?.max_users ?? 0), 0)
    : 0;

  const hasBrandingAccess = me.role === 'ADMIN' || (managedGroups ?? []).some(
    (g: any) => g.groups?.branding?.allow_custom_branding === true
  );

  return res.status(200).json({
    me,
    managedGroups: managedGroups ?? [],
    managedCount: managedCount ?? 0,
    myDecks: myDecks ?? [],
    totalMaxUsers,
    hasBrandingAccess,
  });
});

// GET /subadmin/users
router.get('/subadmin/users', async (req: Request, res: Response) => {
  const me = req.user!;
  const admin = getAdminClient();
  const { page, limit, search } = req.query;

  const { data: managedGroups } = await admin
    .from('group_users')
    .select('group_id, groups(id, name, max_users, max_device_per_user)')
    .eq('user_id', me.id)
    .eq('is_subadmin', true);

  const groupIds = (managedGroups ?? []).map((g: any) => g.group_id);

  if (me.role !== 'ADMIN' && groupIds.length === 0) {
    return res.status(200).json({
      users: [],
      managed_groups: [],
      me: { ...me, current_managed: 0, max_managed_users: 0 },
      ...(page !== undefined || limit !== undefined ? {
        pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false }
      } : {})
    });
  }

  const isPaginated = page !== undefined || limit !== undefined;
  const selectOpts = isPaginated ? { count: 'exact' as const } : undefined;

  let userQuery = admin
    .from('users')
    .select(
      'id, email, role, created_at, max_devices, user_decks(id, deck_id, expired_at, learned_count, progress_percent, streak, deck:decks(title))',
      selectOpts
    )
    .order('created_at', { ascending: false });

  if (me.role !== 'ADMIN') {
    const { data: groupMemberIds } = await admin
      .from('group_users')
      .select('user_id')
      .in('group_id', groupIds);

    const memberIds = Array.from(new Set((groupMemberIds ?? []).map((m: any) => m.user_id)));
    userQuery = userQuery.in('id', memberIds);
  }

  if (search && typeof search === 'string' && search.trim()) {
    userQuery = userQuery.ilike('email', `%${search.trim()}%`);
  }

  let users: any[] | null = null;
  let totalCount = 0;
  let pageNum = 1;
  let limitNum = 20;

  if (isPaginated) {
    pageNum = Math.max(1, parseInt((page as string) || '1', 10));
    const rawLimit = Number(limit);
    limitNum = [10, 20, 30, 50, 100].includes(rawLimit) ? rawLimit : 20;
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    const { data, count, error } = await userQuery.range(from, to);
    if (error) return res.status(500).json({ error: error.message });
    users = data;
    totalCount = count ?? 0;
  } else {
    const { data, error } = await userQuery;
    if (error) return res.status(500).json({ error: error.message });
    users = data;
    totalCount = users?.length || 0;
  }

  const totalMax = (managedGroups ?? []).reduce(
    (acc: number, g: any) => acc + (g.groups?.max_users ?? 0),
    0
  );

  const totalPages = Math.ceil(totalCount / limitNum) || 1;

  return res.status(200).json({
    users: users ?? [],
    managed_groups: managedGroups ?? [],
    me: {
      id: me.id,
      email: me.email,
      role: me.role,
      max_managed_users: totalMax,
      current_managed: totalCount,
    },
    ...(isPaginated ? {
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems: totalCount,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      }
    } : {})
  });
});

// POST /subadmin/users
router.post('/subadmin/users', validate({ body: subadminCreateUserSchema }), async (req: Request, res: Response) => {
  const me = req.user!;
  const { email, role = 'USER', password: customPw, group_id, assign_all_decks, expired_at } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  const admin = getAdminClient();

  let targetGroupId = group_id;
  if (!targetGroupId) {
    const { data: managed } = await admin
      .from('group_users')
      .select('group_id')
      .eq('user_id', me.id)
      .eq('is_subadmin', true)
      .limit(1);
    if (managed && managed.length > 0) targetGroupId = managed[0].group_id;
  }

  if (!targetGroupId && me.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Bạn không quản lý nhóm nào để thêm thành viên' });
  }

  if (me.role !== 'ADMIN') {
    const { data: isManaged } = await admin
      .from('group_users')
      .select('id')
      .eq('user_id', me.id)
      .eq('group_id', targetGroupId)
      .eq('is_subadmin', true)
      .maybeSingle();

    if (!isManaged) {
      return res.status(403).json({ error: 'Bạn không có quyền quản lý nhóm này' });
    }

    const { data: group } = await admin
      .from('groups')
      .select('max_users')
      .eq('id', targetGroupId)
      .single();

    const { count } = await admin
      .from('group_users')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', targetGroupId);

    if (group && count !== null && count >= group.max_users) {
      return res.status(403).json({ error: 'Nhóm đã đạt giới hạn thành viên tối đa' });
    }
  }

  const password = customPw?.trim() || 'goidangkyflashcard';

  // CRITICAL SECURITY FIX (SEC-002): Subadmins can NEVER create accounts with ADMIN or SUBADMIN role
  const targetRole = me.role === 'ADMIN' ? role : 'USER';

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: targetRole,
      skip_system_group: true,
    },
  });

  if (authError) {
    return res.status(400).json({ error: authError.message });
  }

  const userId = authUser.user.id;

  await Promise.all([
    admin.from('users').upsert({ id: userId, email, role: targetRole }, { onConflict: 'id' }),
    admin.from('group_users').insert({ group_id: targetGroupId, user_id: userId, is_subadmin: false }),
  ]);

  if (assign_all_decks && targetGroupId) {
    const { data: groupDecks } = await admin
      .from('group_decks')
      .select('deck_id, expired_at')
      .eq('group_id', targetGroupId);

    if (groupDecks && groupDecks.length > 0) {
      const userDeckRows = groupDecks.map((gd: any) => {
        let finalExpiry = gd.expired_at;
        if (expired_at) {
          const chosenTime = new Date(
            expired_at.includes('T') ? expired_at : expired_at + 'T23:59:59Z'
          ).getTime();
          if (gd.expired_at) {
            const groupTime = new Date(gd.expired_at).getTime();
            finalExpiry = chosenTime < groupTime ? new Date(chosenTime).toISOString() : gd.expired_at;
          } else {
            finalExpiry = new Date(chosenTime).toISOString();
          }
        }
        return {
          user_id: userId,
          deck_id: gd.deck_id,
          expired_at: finalExpiry,
        };
      });

      await admin.from('user_decks').upsert(userDeckRows, { onConflict: 'user_id,deck_id' });
    }
  }

  return res.status(200).json({ user: authUser.user, tempPassword: password });
});

// PATCH /subadmin/users/:id
router.patch('/subadmin/users/:id', validate({ params: idParamSchema, body: subadminUpdateUserSchema }), async (req: Request, res: Response) => {
  const me = req.user!;
  const id = req.params.id as string;

  const allowed = await canManage(me, id);
  if (!allowed) {
    return res.status(403).json({ error: 'Forbidden: Bạn không quản lý người dùng này' });
  }

  const body = req.body;
  const admin = getAdminClient();

  if (body.action === 'reset_password') {
    const pw = generatePassword(8);
    const { error } = await admin.auth.admin.updateUserById(id, { password: pw });
    if (error) return res.status(400).json({ error: error.message });
    memoryCache.invalidateUserTokens(id);
    return res.status(200).json({ tempPassword: pw });
  }

  if (body.action === 'assign_deck') {
    const { deck_id, expired_at } = body;

    const { data: userGroup } = await admin
      .from('group_users')
      .select('group_id')
      .eq('user_id', id)
      .limit(1)
      .single();

    if (!userGroup) {
      return res.status(400).json({ error: 'User không thuộc nhóm nào' });
    }

    const { data: groupDeck } = await admin
      .from('group_decks')
      .select('expired_at')
      .eq('group_id', userGroup.group_id)
      .eq('deck_id', deck_id)
      .maybeSingle();

    if (!groupDeck) {
      return res.status(403).json({ error: 'Flashcard này không thuộc kho tài nguyên của nhóm' });
    }

    let finalExpiredAt = expired_at;
    if (groupDeck.expired_at) {
      const gExp = new Date(groupDeck.expired_at);
      if (!expired_at) {
        finalExpiredAt = groupDeck.expired_at;
      } else {
        const uExp = new Date(expired_at);
        if (uExp > gExp) {
          return res.status(400).json({
            error: `Hạn dùng không được vượt quá hạn của nhóm (${gExp.toLocaleString()})`,
          });
        }
      }
    }

    const { error } = await admin.from('user_decks').upsert(
      {
        user_id: id,
        deck_id,
        expired_at: finalExpiredAt || null,
        progress_percent: 0,
        learned_count: 0,
        streak: 0,
      },
      { onConflict: 'user_id,deck_id' }
    );

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  if (body.action === 'revoke_deck') {
    const { error } = await admin
      .from('user_decks')
      .delete()
      .eq('user_id', id)
      .eq('deck_id', body.deck_id);

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  if (body.action === 'change_role') {
    const { role } = body;
    // CRITICAL SECURITY FIX (SEC-002): Subadmins can NEVER assign ADMIN role!
    if (!role || !['USER', 'SUBADMIN'].includes(role) || (me.role !== 'ADMIN' && role === 'ADMIN')) {
      return res.status(403).json({ error: 'Forbidden: Bạn chỉ có thể phân quyền USER hoặc SUBADMIN' });
    }
    const { error: roleErr } = await admin.from('users').update({ role }).eq('id', id);
    if (roleErr) return res.status(400).json({ error: roleErr.message });

    const { data: meGroups } = await admin
      .from('group_users')
      .select('group_id')
      .eq('user_id', me.id)
      .eq('is_subadmin', true);

    const myGIds = (meGroups ?? []).map((g: any) => g.group_id);

    await admin
      .from('group_users')
      .update({ is_subadmin: role === 'SUBADMIN' })
      .eq('user_id', id)
      .in('group_id', myGIds);

    memoryCache.invalidateUserTokens(id);
    return res.status(200).json({ success: true });
  }

  if (body.action === 'remove_device') {
    const { error } = await admin
      .from('user_devices')
      .delete()
      .eq('user_id', id)
      .eq('device_id', body.device_id);

    if (error) return res.status(400).json({ error: error.message });
    memoryCache.invalidateUserTokens(id);
    return res.status(200).json({ success: true });
  }

  if (body.action === 'reset_devices') {
    const { error } = await admin.from('user_devices').delete().eq('user_id', id);
    if (error) return res.status(400).json({ error: error.message });
    memoryCache.invalidateUserTokens(id);
    return res.status(200).json({ success: true });
  }

  if (body.action === 'change_max_devices') {
    const { max_devices } = body;
    const { data: gu } = await admin
      .from('group_users')
      .select('group_id')
      .eq('user_id', id)
      .limit(1)
      .single();

    if (gu) {
      const { data: g } = await admin
        .from('groups')
        .select('max_device_per_user')
        .eq('id', gu.group_id)
        .single();

      if (g && max_devices && max_devices > g.max_device_per_user) {
        return res.status(400).json({
          error: `Giới hạn nhóm chỉ cho phép tối đa ${g.max_device_per_user} thiết bị/user`,
        });
      }
    }

    const { error } = await admin
      .from('users')
      .update({ max_devices: max_devices || null })
      .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });
    memoryCache.invalidateUserTokens(id);
    return res.status(200).json({ success: true });
  }

  return res.status(400).json({ error: 'Unknown action' });
});

// DELETE /subadmin/users/:id
router.delete('/subadmin/users/:id', validate({ params: idParamSchema }), async (req: Request, res: Response) => {
  const me = req.user!;
  const id = req.params.id as string;

  const allowed = await canManage(me, id);
  if (!allowed) {
    return res.status(403).json({ error: 'Forbidden: Bạn không quản lý người dùng này' });
  }

  const admin = getAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return res.status(400).json({ error: error.message });
  memoryCache.invalidateUserTokens(id);

  return res.status(200).json({ success: true });
});

// GET /subadmin/decks
router.get('/subadmin/decks', async (req: Request, res: Response) => {
  const me = req.user!;
  const admin = getAdminClient();

  if (me.role === 'ADMIN') {
    const { data } = await admin
      .from('decks')
      .select('id, title, description, level, access_level, flashcards(count)')
      .order('created_at', { ascending: true });

    const formatted = (data ?? []).map((d: any) => ({
      ...d,
      word_count: d.flashcards?.[0]?.count ?? 0,
      flashcards: undefined,
    }));
    return res.status(200).json({ decks: formatted });
  }

  const { data: managedGroups } = await admin
    .from('group_users')
    .select('group_id')
    .eq('user_id', me.id)
    .eq('is_subadmin', true);

  const groupIds = (managedGroups ?? []).map((g: any) => g.group_id);
  if (groupIds.length === 0) return res.status(200).json({ decks: [] });

  const { data: groupDecks } = await admin
    .from('group_decks')
    .select('deck_id, expired_at, deck:decks(id, title, description, level, access_level)')
    .in('group_id', groupIds);

  const deckIds = Array.from(
    new Set((groupDecks ?? []).map((gd: any) => gd.deck?.id).filter(Boolean))
  );

  if (deckIds.length === 0) return res.status(200).json({ decks: [] });

  const { data: cards } = await admin
    .from('flashcards')
    .select('deck_id, content')
    .in('deck_id', deckIds);

  const wordMap: Record<string, number> = {};
  (cards ?? []).forEach((c: any) => {
    wordMap[c.deck_id] = (wordMap[c.deck_id] ?? 0) + 1;
  });

  const decks = (groupDecks ?? []).map((gd: any) => ({
    ...(gd.deck ?? {}),
    word_count: wordMap[gd.deck?.id] ?? 0,
    group_expired_at: gd.expired_at,
  }));

  return res.status(200).json({ decks });
});

// GET /subadmin/branding
router.get('/subadmin/branding', async (req: Request, res: Response) => {
  const me = req.user!;
  const admin = getAdminClient();

  let groupIds: string[] = [];
  if (me.role === 'ADMIN') {
    const { data: allGroups } = await admin.from('groups').select('id');
    groupIds = (allGroups ?? []).map((g: any) => g.id);
  } else {
    const { data: myGroups } = await admin
      .from('group_users')
      .select('group_id')
      .eq('user_id', me.id)
      .eq('is_subadmin', true);
    groupIds = (myGroups ?? []).map((g: any) => g.group_id);
  }

  if (groupIds.length === 0) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { data: groups, error } = await admin
    .from('groups')
    .select('id, name, branding')
    .in('id', groupIds)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ groups: groups ?? [], isAdmin: me.role === 'ADMIN' });
});

// PATCH /subadmin/branding
router.patch('/subadmin/branding', validate({ body: subadminBrandingSchema }), async (req: Request, res: Response) => {
  const me = req.user!;
  const admin = getAdminClient();
  const { group_id } = req.body;
  const brandingData = req.body.branding || {
    header_logo_text: req.body.header_logo_text ?? null,
    show_header: req.body.show_header ?? true,
    show_footer: req.body.show_footer ?? true,
  };

  if (!group_id) {
    return res.status(400).json({ error: 'group_id required' });
  }

  if (me.role !== 'ADMIN') {
    const { data: isManaged } = await admin
      .from('group_users')
      .select('id')
      .eq('user_id', me.id)
      .eq('group_id', group_id)
      .eq('is_subadmin', true)
      .maybeSingle();

    if (!isManaged) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }

  const { data: existingGroup } = await admin
    .from('groups')
    .select('branding')
    .eq('id', group_id)
    .single();

  const safeBranding = {
    ...brandingData,
    allow_custom_branding: existingGroup?.branding?.allow_custom_branding ?? (me.role === 'ADMIN'),
  };

  const { error } = await admin
    .from('groups')
    .update({ branding: safeBranding })
    .eq('id', group_id);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
});

export default router;
