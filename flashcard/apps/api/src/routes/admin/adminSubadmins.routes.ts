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
        deck_id, max_users, expired_at, 
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
        const aSub = Boolean(a.is_subadmin || a.user?.role === 'SUBADMIN');
        const bSub = Boolean(b.is_subadmin || b.user?.role === 'SUBADMIN');
        if (aSub && !bSub) return -1;
        if (!aSub && bSub) return 1;
        return 0;
      })
      .map((gu: any) => {
        const u = gu.user;
        const isSubadmin = Boolean(gu.is_subadmin || u?.role === 'SUBADMIN');
        const deckCount = u?.user_decks?.length || 0;
        return {
          id: u?.id,
          email: u?.email,
          role: u?.role,
          created_at: u?.created_at,
          max_devices: u?.max_devices,
          is_subadmin: isSubadmin,
          is_group_subadmin: isSubadmin,
          device_count: u?.user_devices?.length || 0,
          deck_count: deckCount,
          personal_deck_count: deckCount,
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
  const id = req.params.id as string;
  const db = getAdminClient();

  const { data: subGroups, error: sgErr } = await db
    .from('group_users')
    .select('group_id')
    .eq('user_id', id)
    .eq('is_subadmin', true);

  if (sgErr) return res.status(500).json({ error: sgErr.message });
  const groupIds = (subGroups ?? []).map((g: any) => g.group_id);
  if (groupIds.length === 0) return res.status(200).json({ users: [] });

  const { data: memberRows, error: mErr } = await db
    .from('group_users')
    .select('user:users(id, email, role, created_at)')
    .in('group_id', groupIds);

  if (mErr) return res.status(500).json({ error: mErr.message });

  const users = Array.from(
    new Map((memberRows ?? []).map((m: any) => [m.user?.id, m.user])).values()
  ).filter(Boolean);

  return res.status(200).json({ users });
});

// PATCH /admin/subadmins/groups/:id - Update group basic limits
const adminUpdateSubadminGroupHandler = async (req: Request, res: Response) => {
  const id = req.params.id as string;
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
};
router.patch('/admin/subadmins/groups/:id', validate({ body: adminUpdateSubadminGroupSchema }), adminUpdateSubadminGroupHandler);
router.put('/admin/subadmins/groups/:id', validate({ body: adminUpdateSubadminGroupSchema }), adminUpdateSubadminGroupHandler);

// DELETE /admin/subadmins/groups/:id - Delete group
router.delete('/admin/subadmins/groups/:id', async (req: Request, res: Response) => {
  const id = req.params.id as string;
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

/**
 * Recalculate groups.max_users as SUM(group_decks.max_users)
 * Keeps group quota automatically synchronized with deck quotas.
 */
async function syncGroupMaxUsers(supabase: any, groupId: string): Promise<number> {
  const { data: decks, error } = await supabase
    .from('group_decks')
    .select('max_users')
    .eq('group_id', groupId);

  if (error) {
    console.error(`[syncGroupMaxUsers] Failed to fetch group_decks for group ${groupId}:`, error);
    return 0;
  }

  const total = (decks ?? []).reduce((sum: number, d: any) => sum + (Number(d.max_users) || 0), 0);

  const { error: updateError } = await supabase
    .from('groups')
    .update({ max_users: total })
    .eq('id', groupId);

  if (updateError) {
    console.error(`[syncGroupMaxUsers] Failed to update groups.max_users for group ${groupId}:`, updateError);
  }

  return total;
}

// POST /admin/subadmins/groups/:id/actions - Advanced group operations
router.post('/admin/subadmins/groups/:id/actions', validate({ body: adminSubadminGroupActionSchema }), async (req: Request, res: Response) => {
  const id = req.params.id as string;
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
    const { decks, deck_ids, max_users: bodyMaxUsers, expired_at, assign_all_users } = body;
    const defaultMaxUsers = bodyMaxUsers ? Number(bodyMaxUsers) : 10;
    const globalExpiry = expired_at?.trim() ? expired_at.trim() : null;

    let itemsToAssign: Array<{ deck_id: string; max_users: number; expired_at: string | null }> = [];

    if (Array.isArray(decks) && decks.length > 0) {
      itemsToAssign = decks.map((d: any) => ({
        deck_id: d.deck_id,
        max_users: d.max_users ? Number(d.max_users) : defaultMaxUsers,
        expired_at: d.expired_at !== undefined ? (d.expired_at?.trim() ? d.expired_at.trim() : null) : globalExpiry,
      }));
    } else if (Array.isArray(deck_ids) && deck_ids.length > 0) {
      itemsToAssign = deck_ids.map((deck_id: string) => ({
        deck_id,
        max_users: defaultMaxUsers,
        expired_at: globalExpiry,
      }));
    } else {
      return res.status(400).json({ error: 'Chưa chọn Flashcard' });
    }

    const groupDeckRows = itemsToAssign.map(item => ({
      group_id: id,
      deck_id: item.deck_id,
      max_users: item.max_users,
      expired_at: item.expired_at,
    }));

    const { error: gdError } = await supabase
      .from('group_decks')
      .upsert(groupDeckRows, { onConflict: 'group_id,deck_id' });

    if (gdError) return res.status(500).json({ error: gdError.message });

    // Synchronize total group quota: groups.max_users = SUM(group_decks.max_users)
    const totalMaxUsers = await syncGroupMaxUsers(supabase, id);

    if (assign_all_users) {
      const { data: members } = await supabase
        .from('group_users')
        .select('user_id')
        .eq('group_id', id);

      if (members && members.length > 0) {
        const userDeckRows: any[] = [];
        members.forEach((m: any) => {
          itemsToAssign.forEach(item => {
            userDeckRows.push({
              user_id: m.user_id,
              deck_id: item.deck_id,
              expired_at: item.expired_at,
            });
          });
        });
        await supabase.from('user_decks').upsert(userDeckRows, { onConflict: 'user_id,deck_id' });
      }
    }

    return res.status(200).json({ success: true, totalMaxUsers });
  }

  // Update single Deck Quota & Expiry in Group
  if (action === 'update_group_deck') {
    const { deck_id, max_users, expired_at } = body;
    if (!deck_id) {
      return res.status(400).json({ error: 'deck_id là bắt buộc' });
    }
    const finalMaxUsers = Number(max_users);
    if (!finalMaxUsers || finalMaxUsers < 1) {
      return res.status(400).json({ error: 'max_users phải là số nguyên dương' });
    }
    const finalExpiry = expired_at?.trim() ? expired_at.trim() : null;

    const { error: updateError } = await supabase
      .from('group_decks')
      .update({
        max_users: finalMaxUsers,
        expired_at: finalExpiry,
      })
      .eq('group_id', id)
      .eq('deck_id', deck_id);

    if (updateError) return res.status(500).json({ error: updateError.message });

    // Synchronize total group quota: groups.max_users = SUM(group_decks.max_users)
    const totalMaxUsers = await syncGroupMaxUsers(supabase, id);

    return res.status(200).json({ success: true, totalMaxUsers });
  }

  // Revoke Deck from Group
  if (action === 'revoke_group_deck') {
    const { deck_id } = body;
    if (!deck_id) {
      return res.status(400).json({ error: 'deck_id là bắt buộc' });
    }

    const { error: gdDeleteError } = await supabase
      .from('group_decks')
      .delete()
      .eq('group_id', id)
      .eq('deck_id', deck_id);

    if (gdDeleteError) return res.status(500).json({ error: gdDeleteError.message });

    // Clean up student deck slot assignments in group_user_decks
    const { error: gudError } = await supabase
      .from('group_user_decks')
      .delete()
      .eq('group_id', id)
      .eq('deck_id', deck_id);

    if (gudError) {
      console.warn(`[revoke_group_deck] Failed to clear group_user_decks for group ${id}, deck ${deck_id}:`, gudError.message);
    }

    // Synchronize total group quota: groups.max_users = SUM(group_decks.max_users)
    const totalMaxUsers = await syncGroupMaxUsers(supabase, id);

    return res.status(200).json({ success: true, totalMaxUsers });
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
  const id = req.params.id as string;
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
  const id = req.params.id as string;
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
router.put('/admin/subadmins/groups/:id/branding', updateBrandingHandler);

export default router;
