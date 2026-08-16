import { Router, Request, Response } from "express";
import { requireAuth, requireSubAdmin } from "../../middleware/auth";
import { createAdminClient } from "../../lib/supabase";

const router = Router();

async function getSubAdminGroupIds(me: any, admin: ReturnType<typeof createAdminClient>) {
  if (me.role === "ADMIN") {
    const { data: allGroups } = await admin.from("groups").select("id");
    return { groupIds: (allGroups ?? []).map((g: any) => g.id), isAdmin: true };
  }
  const { data: myGroups } = await admin
    .from("group_users").select("group_id").eq("user_id", me.id).eq("is_subadmin", true);
  return { groupIds: (myGroups ?? []).map((g: any) => g.group_id), isAdmin: false };
}

/**
 * GET /api/subadmin/branding
 */
router.get("/", requireAuth, requireSubAdmin, async (req: Request, res: Response) => {
  try {
    const me = req.userProfile;
    const admin = createAdminClient();
    const { groupIds, isAdmin } = await getSubAdminGroupIds(me, admin);

    if (groupIds.length === 0) return res.status(403).json({ error: "Forbidden" });

    const { data: groups, error } = await admin
      .from("groups").select("id, name, branding").in("id", groupIds).order("created_at", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ groups: groups ?? [], isAdmin });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * PATCH /api/subadmin/branding
 */
router.patch("/", requireAuth, requireSubAdmin, async (req: Request, res: Response) => {
  try {
    const me = req.userProfile;
    const admin = createAdminClient();
    const { groupIds, isAdmin } = await getSubAdminGroupIds(me, admin);

    const { group_id, show_header, show_footer, header_logo_text } = req.body;

    if (!group_id || !groupIds.includes(group_id)) {
      return res.status(403).json({ error: "Forbidden: không có quyền quản lý nhóm này" });
    }

    const { data: group, error: fetchErr } = await admin.from("groups").select("branding").eq("id", group_id).single();
    if (fetchErr || !group) return res.status(404).json({ error: "Group not found" });

    const currentBranding = (group.branding ?? {}) as Record<string, any>;

    if (!currentBranding.allow_custom_branding && !isAdmin) {
      return res.status(403).json({ error: "Tính năng branding chưa được admin kích hoạt cho nhóm này" });
    }

    const updatedBranding = {
      ...currentBranding,
      show_header: typeof show_header === "boolean" ? show_header : currentBranding.show_header ?? true,
      show_footer: typeof show_footer === "boolean" ? show_footer : currentBranding.show_footer ?? true,
      header_logo_text:
        typeof header_logo_text === "string" && header_logo_text.trim() ? header_logo_text.trim() : null,
    };

    const { error } = await admin.from("groups").update({ branding: updatedBranding }).eq("id", group_id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true, branding: updatedBranding });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
