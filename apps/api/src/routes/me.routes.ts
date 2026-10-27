import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth, optionalAuth } from '../middlewares/auth.js';
import { getAdminClient } from '../config/supabase.js';

const router = Router();

// GET /me/branding
router.get('/me/branding', optionalAuth, async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(200).json({ branding: null });
  }

  const admin = getAdminClient();
  const { data: groupUsers } = await admin
    .from('group_users')
    .select('group_id')
    .eq('user_id', req.user.id);

  if (!groupUsers || groupUsers.length === 0) {
    return res.status(200).json({ branding: null });
  }

  const groupIds = groupUsers.map((g: any) => g.group_id);

  const { data: groups } = await admin
    .from('groups')
    .select('branding')
    .in('id', groupIds);

  if (!groups) {
    return res.status(200).json({ branding: null });
  }

  const activeBranding = groups
    .map((g: any) => g.branding)
    .find((b: any) => b && b.allow_custom_branding === true);

  return res.status(200).json({ branding: activeBranding ?? null });
});

// GET /me/profile
router.get('/me/profile', requireAuth, (req: Request, res: Response) => {
  res.status(200).json({
    user: req.user,
  });
});

export default router;
