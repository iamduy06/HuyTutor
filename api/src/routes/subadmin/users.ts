import { Router, Request, Response } from "express";
import { requireAuth, requireSubAdmin } from "../../middleware/auth";
import { createAdminClient } from "../../lib/supabase";
import { generatePassword } from "../../lib/utils";

const router = Router();

/**
 * GET /api/subadmin/users
 */
router.get("/", requireAuth, requireSubAdmin, async (req: Request, res: Response) => {
  try {
    const me = req.userProfile;
    const admin = createAdminClient();

    const { data: managedGroups } = await admin
      .from("group_users")
      .select("group_id, groups(id, name, max_users, max_device_per_user)")
      .eq("user_id", me.id)
      .eq("is_subadmin", true);

    const groupIds = (managedGroups ?? []).map((g: any) => g.group_id);

    if (me.role !== "ADMIN" && groupIds.length === 0) {
      return res.json({ users: [], me: { ...me, current_managed: 0, max_managed_users: 0 } });
    }

    let userQuery = admin
      .from("users")
      .select("id, email, role, created_at, max_devices, user_decks(id, deck_id, expired_at, learned_count, progress_percent, streak, deck:decks(title))")
      .order("created_at", { ascending: false });

    if (me.role !== "ADMIN") {
      const { data: groupMemberIds } = await admin.from("group_users").select("user_id").in("group_id", groupIds);
      const memberIds = Array.from(new Set((groupMemberIds ?? []).map((m: any) => m.user_id)));
      userQuery = (userQuery as any).in("id", memberIds);
    }

    const { data: users, error } = await userQuery;
    if (error) return res.status(500).json({ error: error.message });

    const totalMax = (managedGroups ?? []).reduce((acc: number, g: any) => acc + (g.groups?.max_users ?? 0), 0);

    return res.json({
      users: users ?? [],
      managed_groups: managedGroups ?? [],
      me: { id: me.id, email: me.email, role: me.role, max_managed_users: totalMax, current_managed: users?.length || 0 },
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * POST /api/subadmin/users — create user and add to group
 */
router.post("/", requireAuth, requireSubAdmin, async (req: Request, res: Response) => {
  try {
    const me = req.userProfile;
    const { email, role = "USER", password: customPw, group_id, assign_all_decks, expired_at } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const admin = createAdminClient();

    let targetGroupId = group_id;
    if (!targetGroupId) {
      const { data: managed } = await admin
        .from("group_users").select("group_id").eq("user_id", me.id).eq("is_subadmin", true).limit(1);
      if (managed && managed.length > 0) targetGroupId = managed[0].group_id;
    }

    if (!targetGroupId && me.role !== "ADMIN") {
      return res.status(403).json({ error: "Bạn không quản lý nhóm nào để thêm thành viên" });
    }

    if (me.role !== "ADMIN") {
      const { data: isManaged } = await admin
        .from("group_users").select("id").eq("user_id", me.id).eq("group_id", targetGroupId).eq("is_subadmin", true).maybeSingle();
      if (!isManaged) return res.status(403).json({ error: "Bạn không có quyền quản lý nhóm này" });

      const { data: group } = await admin.from("groups").select("max_users").eq("id", targetGroupId).single();
      const { count } = await admin.from("group_users").select("*", { count: "exact", head: true }).eq("group_id", targetGroupId);
      if (group && count !== null && count >= group.max_users) {
        return res.status(403).json({ error: "Nhóm đã đạt giới hạn thành viên tối đa" });
      }
    }

    const password = customPw?.trim() || "goidangkyflashcard";

    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { role, skip_system_group: true },
    });

    if (authError) return res.status(400).json({ error: authError.message });

    const userId = authUser.user.id;
    await Promise.all([
      admin.from("users").upsert({ id: userId, email, role }, { onConflict: "id" }),
      admin.from("group_users").insert({ group_id: targetGroupId, user_id: userId, is_subadmin: false }),
    ]);

    if (assign_all_decks && targetGroupId) {
      const { data: groupDecks } = await admin.from("group_decks").select("deck_id, expired_at").eq("group_id", targetGroupId);
      if (groupDecks && groupDecks.length > 0) {
        const userDeckRows = groupDecks.map((gd: any) => {
          let finalExpiry = gd.expired_at;
          if (expired_at) {
            const chosenTime = new Date(expired_at.includes("T") ? expired_at : expired_at + "T23:59:59Z").getTime();
            if (gd.expired_at) {
              const groupTime = new Date(gd.expired_at).getTime();
              finalExpiry = chosenTime < groupTime ? new Date(chosenTime).toISOString() : gd.expired_at;
            } else {
              finalExpiry = new Date(chosenTime).toISOString();
            }
          }
          return { user_id: userId, deck_id: gd.deck_id, expired_at: finalExpiry };
        });
        await admin.from("user_decks").upsert(userDeckRows, { onConflict: "user_id,deck_id" });
      }
    }

    return res.status(201).json({ user: authUser.user, tempPassword: password });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
