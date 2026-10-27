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

// GET /me/profile - Current user profile with subadmin status
router.get('/me/profile', requireAuth, async (req: Request, res: Response) => {
  const user = req.user!;
  const admin = getAdminClient();

  const { data: groupSub } = await admin
    .from('group_users')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_subadmin', true)
    .limit(1)
    .maybeSingle();

  return res.status(200).json({
    user: {
      ...user,
      is_subadmin: !!groupSub,
    },
  });
});

// GET /me/dashboard - Full dashboard data for current user
router.get('/me/dashboard', requireAuth, async (req: Request, res: Response) => {
  const user = req.user!;
  const admin = getAdminClient();

  const [
    { data: profile },
    { data: userDecks },
    { data: publicDecks },
  ] = await Promise.all([
    admin.from('users').select('*').eq('id', user.id).single(),
    admin
      .from('user_decks')
      .select('id, deck_id, progress_percent, learned_count, streak, expired_at, deck:decks(id, title, description, level, access_level)')
      .eq('user_id', user.id)
      .order('deck_id'),
    admin
      .from('decks')
      .select('id, title, description, level, access_level')
      .or('access_level->public.eq.true,access_level->auth.eq.true')
      .order('created_at', { ascending: true }),
  ]);

  const filteredUserDecks = (userDecks ?? []).filter((ud: any) => {
    const levels = ud.deck?.access_level ?? {};
    return levels.public === true || levels.auth === true || levels.paid === true;
  });

  const assignedDeckIds = new Set(filteredUserDecks.map((ud: any) => ud.deck_id as string));
  const extraPublicDecks = (publicDecks ?? []).filter(d => !assignedDeckIds.has(d.id));

  // Word counts
  const allDeckIds = [
    ...filteredUserDecks.map((ud: any) => ud.deck_id as string),
    ...extraPublicDecks.map(d => d.id as string),
  ];

  const { data: flashcardRows } = allDeckIds.length > 0
    ? await admin.from('flashcards').select('deck_id, content').in('deck_id', allDeckIds)
    : { data: [] };

  const { extractTabs } = await import('@huytutor/shared');
  const wordCountMap: Record<string, number> = {};
  (flashcardRows ?? []).forEach((r: any) => {
    const tabs = extractTabs(r.content);
    const count = tabs.reduce((s: number, t: any) => s + (t.vocabulary?.length ?? 0), 0);
    wordCountMap[r.deck_id] = (wordCountMap[r.deck_id] ?? 0) + count;
  });

  return res.status(200).json({
    profile,
    userDecks: filteredUserDecks,
    extraPublicDecks,
    wordCountMap,
  });
});

export default router;
