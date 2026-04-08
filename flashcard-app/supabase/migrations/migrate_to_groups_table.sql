-- ============================================================
-- Migration: Implement groups table and update users reference
-- ============================================================

-- 1. Create the groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  owner_id    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Migrate existing subadmins who are currently identifying as groups
-- Any subadmin who has group_id = self (or is currently a "group owner" by logic)
-- For now, let's create a group for every existing SUBADMIN.
INSERT INTO public.groups (id, name, owner_id)
SELECT id, 'Nhóm của ' || email, id
FROM public.users
WHERE role = 'SUBADMIN'
ON CONFLICT (id) DO NOTHING;

-- 3. Update users table structure
-- Remove old recursive reference
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_group_id_fkey;

-- Update group_id for existing users who were managed by a subadmin
-- If user.group_id was used as SubadminID, it still works because we used SubadminID for groups.id above.

-- Add formal foreign key to groups table
ALTER TABLE public.users 
  ADD CONSTRAINT users_group_id_fkey 
  FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE SET NULL;

-- 4. Enable RLS for groups
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- 5. Groups Policies
DROP POLICY IF EXISTS "groups_select" ON public.groups;
CREATE POLICY "groups_select" ON public.groups FOR SELECT USING (
  public.is_admin() 
  OR id IN (SELECT group_id FROM public.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "groups_admin_all" ON public.groups;
CREATE POLICY "groups_admin_all" ON public.groups FOR ALL USING (public.is_admin());

-- 6. Update users RLS to be more robust with groups
DROP POLICY IF EXISTS "users_select" ON public.users;
CREATE POLICY "users_select" ON public.users FOR SELECT USING (
  auth.uid() = id
  OR public.is_admin()
  OR (
    public.is_subadmin() 
    AND group_id = (SELECT group_id FROM public.users WHERE id = auth.uid())
  )
);

-- Update Insert/Update/Delete for subadmins to be within group
DROP POLICY IF EXISTS "users_insert" ON public.users;
CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (
  public.is_admin()
  OR (
    public.is_subadmin() 
    AND (NEW.group_id = (SELECT group_id FROM public.users WHERE id = auth.uid()))
  )
);

DROP POLICY IF EXISTS "users_update" ON public.users;
CREATE POLICY "users_update" ON public.users FOR UPDATE USING (
  public.is_admin()
  OR (
    public.is_subadmin() 
    AND group_id = (SELECT group_id FROM public.users WHERE id = auth.uid())
  )
);

DROP POLICY IF EXISTS "users_delete" ON public.users;
CREATE POLICY "users_delete" ON public.users FOR DELETE USING (
  public.is_admin()
  -- Subadmin can delete users in their group (but maybe only Admin should delete subadmins? 
  -- For now, allow subadmin to delete within group as requested)
  OR (
    public.is_subadmin() 
    AND group_id = (SELECT group_id FROM public.users WHERE id = auth.uid())
  )
);
