import { Router, Request, Response } from "express";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import { createAdminClient } from "../../lib/supabase";
import { generatePassword } from "../../lib/utils";

const router = Router();

/**
 * GET /api/admin/users
 */
router.get("/", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const supabase = createAdminClient();
    const { data: users, error } = await supabase
      .from("users")
      .select(`
        *,
        user_decks(id, deck_id, expired_at, progress_percent, learned_count, deck:decks(title)),
        group_users(group_id, is_subadmin, group:groups(name)),
        user_devices(id, device_id, device_name, ip_address, last_seen)
      `)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ users });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * POST /api/admin/users — create user
 */
router.post("/", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { email, role = "USER", max_devices, group_id, auto_assign_group_decks } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const password = req.body.password?.trim() || "goidangkyflashcard";
    const supabase = createAdminClient();

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { role, created_by_admin: true, skip_system_group: !!(group_id && group_id !== "none") },
    });

    if (authError) return res.status(400).json({ error: authError.message });

    if (max_devices !== undefined && max_devices !== null && max_devices !== "") {
      const { error: upsertError } = await supabase.from("users").upsert(
        { id: authUser.user.id, email, role, max_devices: parseInt(max_devices) },
        { onConflict: "id" }
      );
      if (upsertError) console.error("Profile upsert error:", upsertError.message);
    }

    if (group_id && group_id !== "none") {
      await supabase.from("group_users").insert({ group_id, user_id: authUser.user.id, is_subadmin: false });
      if (auto_assign_group_decks) {
        const { data: groupDecks } = await supabase.from("group_decks").select("deck_id, expired_at").eq("group_id", group_id);
        if (groupDecks && groupDecks.length > 0) {
          const deckInserts = groupDecks.map((d: any) => ({
            user_id: authUser.user.id, deck_id: d.deck_id, expired_at: d.expired_at,
            progress_percent: 0, learned_count: 0,
          }));
          const { error: assignError } = await supabase.from("user_decks").insert(deckInserts);
          if (assignError) console.error("Auto assign decks error:", assignError.message);
        }
      }
    }

    return res.status(201).json({ user: authUser.user, tempPassword: password });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * PATCH /api/admin/users/:id — various actions
 */
router.patch("/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const supabase = createAdminClient();
    const body = req.body;

    if (body.action === "reset_password") {
      const newPassword = generatePassword(8);
      const { error } = await supabase.auth.admin.updateUserById(req.params.id as string, { password: newPassword });
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ tempPassword: newPassword });
    }

    if (body.action === "change_info") {
      const { role, max_devices } = body;
      if (req.params.id === req.user.id && role && role !== "ADMIN") {
        return res.status(400).json({ error: "Không thể tự xoá quyền Admin của chính mình" });
      }
      const updateData: any = {};
      if (role) {
        if (!["USER", "SUBADMIN", "ADMIN"].includes(role)) return res.status(400).json({ error: "Invalid role" });
        updateData.role = role;
      }
      if (max_devices !== undefined) updateData.max_devices = max_devices;
      const { error: dbErr } = await supabase.from("users").update(updateData).eq("id", req.params.id);
      if (dbErr) return res.status(500).json({ error: dbErr.message });
      return res.json({ success: true, updateData });
    }

    if (body.action === "assign_group") {
      const { group_id, revoke_old_decks, assign_new_decks } = body;
      let oldGroupId = null;
      if (revoke_old_decks) {
        const { data: oldGroup } = await supabase.from("group_users").select("group_id").eq("user_id", req.params.id).single();
        if (oldGroup) oldGroupId = oldGroup.group_id;
      }
      await supabase.from("group_users").delete().eq("user_id", req.params.id);
      if (group_id) {
        const { error } = await supabase.from("group_users").insert({ group_id, user_id: req.params.id, is_subadmin: false });
        if (error) return res.status(500).json({ error: error.message });
      }
      if (revoke_old_decks && oldGroupId) {
        const { data: oldDecks } = await supabase.from("group_decks").select("deck_id").eq("group_id", oldGroupId);
        if (oldDecks && oldDecks.length > 0) {
          const deckIdsToRemove = oldDecks.map((d: any) => d.deck_id);
          await supabase.from("user_decks").delete().eq("user_id", req.params.id).in("deck_id", deckIdsToRemove);
        }
      }
      if (assign_new_decks && group_id) {
        const { data: newDecks } = await supabase.from("group_decks").select("deck_id, expired_at").eq("group_id", group_id);
        if (newDecks && newDecks.length > 0) {
          const deckInserts = newDecks.map((d: any) => ({
            user_id: req.params.id, deck_id: d.deck_id, expired_at: d.expired_at,
            progress_percent: 0, learned_count: 0, streak: 0,
          }));
          await supabase.from("user_decks").upsert(deckInserts, { onConflict: "user_id,deck_id" });
        }
      }
      return res.json({ success: true });
    }

    if (body.action === "assign_deck") {
      const { deck_id, expired_at, progress_percent = 0, learned_count = 0 } = body;
      const expiredAtValue: string | null = expired_at?.trim() ? expired_at : null;
      const { error } = await supabase.from("user_decks").upsert(
        { user_id: req.params.id, deck_id, expired_at: expiredAtValue, progress_percent, learned_count, streak: 0 },
        { onConflict: "user_id,deck_id" }
      );
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ success: true });
    }

    if (body.action === "update_deck_progress") {
      const { deck_id, progress_percent, learned_count, expired_at } = body;
      const updateData: any = {};
      if (progress_percent !== undefined) updateData.progress_percent = progress_percent;
      if (learned_count !== undefined) updateData.learned_count = learned_count;
      if (expired_at !== undefined) updateData.expired_at = expired_at?.trim() ? expired_at : null;
      const { error } = await supabase.from("user_decks").update(updateData).eq("user_id", req.params.id).eq("deck_id", deck_id);
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ success: true });
    }

    if (body.action === "revoke_deck") {
      const { deck_id } = body;
      const { error } = await supabase.from("user_decks").delete().eq("user_id", req.params.id).eq("deck_id", deck_id);
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ success: true });
    }

    if (body.action === "remove_device") {
      const { device_id } = body;
      await supabase.from("user_devices").delete().eq("user_id", req.params.id).eq("device_id", device_id);
      await supabase.auth.admin.signOut(req.params.id as string);
      return res.json({ success: true });
    }

    if (body.action === "reset_devices") {
      await supabase.from("user_devices").delete().eq("user_id", req.params.id);
      await supabase.auth.admin.signOut(req.params.id as string);
      return res.json({ success: true });
    }

    if (body.action === "bulk_update_expiry") {
      const { expired_at } = body;
      const expiredAtValue: string | null = expired_at?.trim() ? expired_at : null;
      const { error } = await supabase.from("user_decks").update({ expired_at: expiredAtValue }).eq("user_id", req.params.id);
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ success: true });
    }

    return res.status(400).json({ error: "Unknown action" });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * DELETE /api/admin/users/:id
 */
router.delete("/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.auth.admin.deleteUser(req.params.id as string);
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
