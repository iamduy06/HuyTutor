import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/roleGuard.js';
import { getAdminClient } from '../../config/supabase.js';
import { generatePassword } from '@huytutor/shared';

const router = Router();
router.use(requireAuth, requireRole('ADMIN'));

// GET /admin/users
router.get('/admin/users', async (_req: Request, res: Response) => {
  const supabase = getAdminClient();
  const { data: users, error } = await supabase
    .from('users')
    .select(`
      *, 
      user_decks(id, deck_id, expired_at, progress_percent, learned_count, deck:decks(title)), 
      group_users(group_id, is_subadmin, group:groups(name)),
      user_devices(id, device_id, device_name, ip_address, last_seen)
    `)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ users });
});

// POST /admin/users
router.post('/admin/users', async (req: Request, res: Response) => {
  const body = req.body;
  const { email, role = 'USER', max_devices, group_id, auto_assign_group_decks } = body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const password = body.password?.trim() || 'goidangkyflashcard';
  const supabase = getAdminClient();

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role,
      created_by_admin: true,
      skip_system_group: !!(group_id && group_id !== 'none'),
    },
  });

  if (authError) return res.status(400).json({ error: authError.message });

  const userId = authUser.user.id;

  if (max_devices !== undefined && max_devices !== null && max_devices !== '') {
    await supabase.from('users').upsert({
      id: userId,
      email,
      role,
      max_devices: Number(max_devices),
    });
  }

  if (group_id && group_id !== 'none') {
    await supabase.from('group_users').insert({
      group_id,
      user_id: userId,
      is_subadmin: role === 'SUBADMIN',
    });

    if (auto_assign_group_decks) {
      const { data: groupDecks } = await supabase
        .from('group_decks')
        .select('deck_id, expired_at')
        .eq('group_id', group_id);

      if (groupDecks && groupDecks.length > 0) {
        const userDeckRows = groupDecks.map((gd: any) => ({
          user_id: userId,
          deck_id: gd.deck_id,
          expired_at: gd.expired_at || null,
        }));
        await supabase.from('user_decks').upsert(userDeckRows, { onConflict: 'user_id,deck_id' });
      }
    }
  }

  return res.status(200).json({ user: authUser.user, tempPassword: password });
});

// PATCH /admin/users/:id
router.patch('/admin/users/:id', async (req: Request, res: Response) => {
  const admin = req.user!;
  const id = req.params.id as string;
  const body = req.body;
  const supabase = getAdminClient();

  // Reset password
  if (body.action === 'reset_password') {
    const newPassword = generatePassword(8);
    const { error } = await supabase.auth.admin.updateUserById(id, { password: newPassword });
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ tempPassword: newPassword });
  }

  // Change info (role, max_devices)
  if (body.action === 'change_info') {
    const { role, max_devices } = body;
    if (id === admin.id && role && role !== 'ADMIN') {
      return res.status(400).json({ error: 'Không thể tự xoá quyền Admin của chính mình' });
    }
    const updateData: any = {};
    if (role) {
      if (!['USER', 'SUBADMIN', 'ADMIN'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      updateData.role = role;
    }
    if (max_devices !== undefined) updateData.max_devices = max_devices;

    const { error: dbErr } = await supabase.from('users').update(updateData).eq('id', id);
    if (dbErr) return res.status(500).json({ error: dbErr.message });
    return res.status(200).json({ success: true, updateData });
  }

  // Assign Group
  if (body.action === 'assign_group') {
    const { group_id, revoke_old_decks, assign_new_decks } = body;

    let oldGroupId = null;
    if (revoke_old_decks) {
      const { data: oldGroup } = await supabase
        .from('group_users')
        .select('group_id')
        .eq('user_id', id)
        .single();
      if (oldGroup) oldGroupId = oldGroup.group_id;
    }

    await supabase.from('group_users').delete().eq('user_id', id);

    if (group_id && group_id !== 'none') {
      const { data: targetUser } = await supabase.from('users').select('role').eq('id', id).single();
      await supabase.from('group_users').insert({
        group_id,
        user_id: id,
        is_subadmin: targetUser?.role === 'SUBADMIN',
      });
    }

    if (revoke_old_decks && oldGroupId) {
      const { data: oldDecks } = await supabase
        .from('group_decks')
        .select('deck_id')
        .eq('group_id', oldGroupId);

      if (oldDecks && oldDecks.length > 0) {
        const oldDeckIds = oldDecks.map((d: any) => d.deck_id);
        await supabase.from('user_decks').delete().eq('user_id', id).in('deck_id', oldDeckIds);
      }
    }

    if (assign_new_decks && group_id && group_id !== 'none') {
      const { data: newDecks } = await supabase
        .from('group_decks')
        .select('deck_id, expired_at')
        .eq('group_id', group_id);

      if (newDecks && newDecks.length > 0) {
        const userDeckRows = newDecks.map((gd: any) => ({
          user_id: id,
          deck_id: gd.deck_id,
          expired_at: gd.expired_at || null,
        }));
        await supabase.from('user_decks').upsert(userDeckRows, { onConflict: 'user_id,deck_id' });
      }
    }

    return res.status(200).json({ success: true });
  }

  // Remove from group
  if (body.action === 'remove_from_group') {
    await supabase.from('group_users').delete().eq('user_id', id);
    return res.status(200).json({ success: true });
  }

  // Assign Deck
  if (body.action === 'assign_deck') {
    const { deck_id, expired_at } = body;
    const { error } = await supabase.from('user_decks').upsert(
      {
        user_id: id,
        deck_id,
        expired_at: expired_at || null,
        progress_percent: 0,
        learned_count: 0,
        streak: 0,
      },
      { onConflict: 'user_id,deck_id' }
    );
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  // Revoke Deck
  if (body.action === 'revoke_deck') {
    const { deck_id } = body;
    const { error } = await supabase
      .from('user_decks')
      .delete()
      .eq('user_id', id)
      .eq('deck_id', deck_id);
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  // Remove Device
  if (body.action === 'remove_device') {
    const { error } = await supabase
      .from('user_devices')
      .delete()
      .eq('user_id', id)
      .eq('device_id', body.device_id);
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  // Reset Devices
  if (body.action === 'reset_devices') {
    const { error } = await supabase.from('user_devices').delete().eq('user_id', id);
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(400).json({ error: 'Unknown action' });
});

// DELETE /admin/users/:id
router.delete('/admin/users/:id', async (req: Request, res: Response) => {
  const admin = req.user!;
  const id = req.params.id as string;

  if (id === admin.id) {
    return res.status(400).json({ error: 'Không thể xoá chính tài khoản của bạn' });
  }

  const supabase = getAdminClient();
  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) return res.status(400).json({ error: error.message });
  return res.status(200).json({ success: true });
});

export default router;
