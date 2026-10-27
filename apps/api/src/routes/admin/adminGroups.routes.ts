import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/roleGuard.js';
import { getAdminClient } from '../../config/supabase.js';

const router = Router();
router.use(requireAuth, requireRole('ADMIN'));

// ─── DECK GROUPS ─────────────────────────────────────────────────────────────

// GET /admin/deck-groups
router.get('/admin/deck-groups', async (_req: Request, res: Response) => {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('deck_groups')
    .select('*')
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ groups: data });
});

// POST /admin/deck-groups
router.post('/admin/deck-groups', async (req: Request, res: Response) => {
  const { name, description, order_index } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('deck_groups')
    .insert({ name, description, order_index: order_index ?? 0 })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ group: data });
});

// PATCH /admin/deck-groups/:id
router.patch('/admin/deck-groups/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, order_index } = req.body;

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('deck_groups')
    .update({ name, description, order_index })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ group: data });
});

// DELETE /admin/deck-groups/:id
router.delete('/admin/deck-groups/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const supabase = getAdminClient();

  const { error } = await supabase.from('deck_groups').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
});

// ─── USER GROUPS ─────────────────────────────────────────────────────────────

// GET /admin/groups
router.get('/admin/groups', async (_req: Request, res: Response) => {
  const supabase = getAdminClient();
  const { data: rawGroups, error } = await supabase
    .from('groups')
    .select('*, group_decks(expired_at)')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const groups =
    rawGroups?.map((g: any) => {
      let maxExpiry = null;
      const upperName = g.name.trim().toUpperCase();

      if (upperName === 'ĐĂNG KÝ 6 THÁNG') {
        const now = new Date();
        now.setMonth(now.getMonth() + 6);
        maxExpiry = now.toISOString().split('T')[0];
      } else if (upperName === 'ĐĂNG KÝ 1 NĂM') {
        const now = new Date();
        now.setFullYear(now.getFullYear() + 1);
        maxExpiry = now.toISOString().split('T')[0];
      } else if (upperName === 'ĐĂNG KÝ 2 NĂM') {
        const now = new Date();
        now.setFullYear(now.getFullYear() + 2);
        maxExpiry = now.toISOString().split('T')[0];
      } else if (upperName === 'ĐĂNG KÝ 3 NĂM') {
        const now = new Date();
        now.setFullYear(now.getFullYear() + 3);
        maxExpiry = now.toISOString().split('T')[0];
      } else if (g.group_decks && g.group_decks.length > 0) {
        const expiries = g.group_decks
          .map((gd: any) => gd.expired_at)
          .filter(Boolean)
          .map((dateStr: string) => new Date(dateStr).getTime());
        if (expiries.length > 0) {
          maxExpiry = new Date(Math.max(...expiries)).toISOString().split('T')[0];
        }
      }

      const { group_decks, ...rest } = g;
      return { ...rest, max_expired_at: maxExpiry };
    }) || [];

  return res.status(200).json({ groups });
});

// POST /admin/groups
router.post('/admin/groups', async (req: Request, res: Response) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const supabase = getAdminClient();
  const { data: newGroup, error } = await supabase
    .from('groups')
    .insert({ name, description })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ group: newGroup });
});

// PATCH /admin/groups/:id
router.patch('/admin/groups/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body;

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('groups')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ group: data });
});

// DELETE /admin/groups/:id
router.delete('/admin/groups/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const supabase = getAdminClient();

  const { error } = await supabase.from('groups').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
});

export default router;
