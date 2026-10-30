import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/roleGuard.js';
import { getAdminClient } from '../../config/supabase.js';
import { validate } from '../../middlewares/validate.js';
import {
  adminCreateSubadminGroupSchema,
  adminUpdateSubadminGroupSchema,
  adminSubadminGroupActionSchema,
} from '@huytutor/shared';

const router = Router();
router.use('/admin', requireAuth, requireRole('ADMIN'));

// GET /admin/subadmins - List all groups with subadmin & user details
router.get('/admin/subadmins', async (_req: Request, res: Response) => {
  const supabase = getAdminClient();

  const { data: groups, error } = await supabase
    .from('groups')
    .select(`
      id, name, max_users, max_device_per_user, is_system, system_type, created_at, branding,
      group_decks(
        deck_id, expired_at, 
        deck:decks(title)
      ),
      group_users(
        is_subadmin,
        user:users(
          id, email, role, created_at, max_devices,
          user_devices!user_devices_user_id_fkey(device_id, device_name, ip_address, last_seen),
          user_decks(deck_id, expired_at, progress_percent, learned_count, deck:decks(title))
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const processed = (groups ?? []).map((g: any) => ({
    ...g,
    user_count: g.group_users?.length || 0,
    group_users: (g.group_users ?? [])
      .sort((a: any, b: any) => {
        if (a.is_subadmin && !b.is_subadmin) return -1;
        if (!a.is_subadmin && b.is_subadmin) return 1;
        return 0;
      })
      .map((gu: any) => {
        const u = gu.user;
        return {
          id: u?.id,
          email: u?.email,
          role: u?.role,
          created_at: u?.created_at,
          max_devices: u?.max_devices,
          is_subadmin: gu.is_subadmin,
          device_count: u?.user_devices?.length || 0,
          personal_deck_count: u?.user_decks?.length || 0,
          user_devices: u?.user_devices || [],
          user_decks: u?.user_decks || [],
        };
      }),
  }));

  return res.status(200).json({ groups: processed });
});

// POST /admin/subadmins - Create new group
router.post('/admin/subadmins', validate({ body: adminCreateSubadminGroupSchema }), async (req: Request, res: Response) => {
  const { name, max_users, max_device_per_user, branding } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Tên nhóm không được để trống' });
  }

  const supabase = getAdminClient();
  const { data: newGroup, error } = await supabase
    .from('groups')
    .insert({
      name: name.trim(),
      max_users: max_users ? parseInt(max_users, 10) : 50,
      max_device_per_user: max_device_per_user ? parseInt(max_device_per_user, 10) : 1,
      is_system: false,
      branding: branding ?? {
        allow_custom_branding: true,
        show_header: true,
        show_footer: true,
        header_logo_text: null,
      },
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ group: newGroup });
});

// GET /admin/subadmins/:id/managed
router.get('/admin/subadmins/:id/managed', async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getAdminClient();

  const { data, error } = await db
    .from('users')
    .select('id, email, role, created_at')
    .eq('created_by', id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ users: data ?? [] });
});

// PATCH /admin/subadmins/groups/:id - Update group basic limits
router.patch('/admin/subadmins/groups/:id', validate({ body: adminUpdateSubadminGroupSchema }), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, max_users, max_device_per_user } = req.body;

  if (name !== undefined && (!name || name.trim() === '')) {
    return res.status(400).json({ error: 'Tên nhóm không được để trống' });
  }

  const supabase = getAdminClient();

  if (max_users !== undefined) {
    const { count } = await supabase
      .from('group_users')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', id);

    if (count && max_users < count) {
      return res.status(400).json({
        error: `Giới hạn (max_users) không được nhỏ hơn số user hiện tại (${count})`,
      });
    }
  }

  const { error } = await supabase
    .from('groups')
    .update({ name, max_users, max_device_per_user })
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
});

// DELETE /admin/subadmins/groups/:id - Delete group
router.delete('/admin/subadmins/groups/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const supabase = getAdminClient();

  const { count } = await supabase
    .from('group_users')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', id);

  if (count && count > 0) {
    return res.status(400).json({
      error: 'Không thể xoá nhóm vẫn còn thành viên. Vui lòng di chuyển hoặc xoá vĩnh viễn users trước.',
    });
  }

  const { error } = await supabase.from('groups').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ success: true });
});

// POST /admin/subadmins/groups/:id/actions - Advanced group operations
router.post('/admin/subadmins/groups/:id/actions', validate({ body: adminSubadminGroupActionSchema }), async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body;
  const supabase = getAdminClient();
  const { action } = body;

  // Toggle subadmin in group
  if (action === 'toggle_subadmin') {
    const { user_id, is_subadmin } = body;

    const { error: guError } = await supabase
      .from('group_users')
      .update({ is_subadmin })
      .eq('group_id', id)
      .eq('user_id', user_id);

    if (guError) return res.status(500).json({ error: guError.message });

    const { data: otherGroups } = await supabase
      .from('group_users')
      .select('id')
      .eq('user_id', user_id)
      .eq('is_subadmin', true)
      .limit(1);

    const hasAnySubadminPrivilege = otherGroups && otherGroups.length > 0;
    const newRole = hasAnySubadminPrivilege ? 'SUBADMIN' : 'USER';

    await supabase.from('users').update({ role: newRole }).eq('id', user_id);

    return res.status(200).json({ success: true, syncedRole: newRole });
  }

  // Assign multiple Decks to Group
  if (action === 'assign_group_deck') {
    const { deck_ids, expired_at, assign_all_users } = body;
    const finalExpiry = expired_at?.trim() ? expired_at : null;

    if (!Array.isArray(deck_ids) || deck_ids.length === 0) {
      return res.status(400).json({ error: 'Chưa chọn Flashcard' });
    }

    const groupDeckRows = deck_ids.map(deck_id => ({
      group_id: id,
      deck_id,
      expired_at: finalExpiry,
    }));

    const { error: gdError } = await supabase
      .from('group_decks')
      .upsert(groupDeckRows, { onConflict: 'group_id,deck_id' });

    if (gdError) return res.status(500).json({ error: gdError.message });

    if (assign_all_users) {
      const { data: members } = await supabase
        .from('group_users')
        .select('user_id')
        .eq('group_id', id);

      if (members && members.length > 0) {
        const userDeckRows: any[] = [];
        members.forEach(m => {
          deck_ids.forEach(dId => {
            userDeckRows.push({
              user_id: m.user_id,
              deck_id: dId,
              expired_at: finalExpiry,
            });
          });
        });
        await supabase.from('user_decks').upsert(userDeckRows, { onConflict: 'user_id,deck_id' });
      }
    }

    return res.status(200).json({ success: true });
  }

  // Revoke Deck from Group
  if (action === 'revoke_group_deck') {
    const { deck_id } = body;
    const { error } = await supabase
      .from('group_decks')
      .delete()
      .eq('group_id', id)
      .eq('deck_id', deck_id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  // Move member to another group
  if (action === 'move_member') {
    const { user_id, target_group_id, clear_decks } = body;

    const { error: moveError } = await supabase
      .from('group_users')
      .update({ group_id: target_group_id, is_subadmin: false })
      .eq('user_id', user_id)
      .eq('group_id', id);

    if (moveError) return res.status(500).json({ error: moveError.message });

    if (clear_decks) {
      await supabase.from('user_decks').delete().eq('user_id', user_id);
    }

    return res.status(200).json({ success: true });
  }

  // Add member to group
  if (action === 'add_member') {
    const { user_id } = body;

    const [{ count }, { data: group }] = await Promise.all([
      supabase.from('group_users').select('*', { count: 'exact', head: true }).eq('group_id', id),
      supabase.from('groups').select('max_users').eq('id', id).single(),
    ]);

    if (count !== null && group !== null && count >= group.max_users) {
      return res.status(400).json({ error: 'Nhóm đã đạt giới hạn thành viên (max_users)' });
    }

    const { error } = await supabase
      .from('group_users')
      .insert({ group_id: id, user_id, is_subadmin: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(400).json({ error: 'Invalid action' });
});

// GET /admin/subadmins/groups/:id/branding
router.get('/admin/subadmins/groups/:id/branding', async (req: Request, res: Response) => {
  const { id } = req.params;
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('groups')
    .select('id, name, branding')
    .eq('id', id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ branding: data.branding });
});

// POST & PATCH /admin/subadmins/groups/:id/branding
const updateBrandingHandler = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { branding } = req.body;

  if (!branding || typeof branding !== 'object') {
    return res.status(400).json({ error: 'branding is required' });
  }

  const validBranding = {
    allow_custom_branding: Boolean(branding.allow_custom_branding),
    show_header: Boolean(branding.show_header ?? true),
    show_footer: Boolean(branding.show_footer ?? true),
    header_logo_text:
      typeof branding.header_logo_text === 'string' && branding.header_logo_text.trim()
        ? branding.header_logo_text.trim()
        : null,
  };

  const supabase = getAdminClient();
  const { error } = await supabase
    .from('groups')
    .update({ branding: validBranding })
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true, branding: validBranding });
};

router.post('/admin/subadmins/groups/:id/branding', updateBrandingHandler);
router.patch('/admin/subadmins/groups/:id/branding', updateBrandingHandler);

export default router;
