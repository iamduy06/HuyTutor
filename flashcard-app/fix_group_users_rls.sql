-- FIX RLS RECURSION FOR group_users Table
-- Run this in your Supabase SQL Editor

-- 1. Remove the old recursive policy
DROP POLICY IF EXISTS "GroupUsers: access" ON public.group_users;

-- 2. Policy: Users can always read their own records
-- This allows the login process and permission checks to succeed without recursion
CREATE POLICY "GroupUsers: view own" 
ON public.group_users 
FOR SELECT 
USING (
  auth.uid() = user_id
);

-- 3. Policy: Admin access (Global)
-- Uses the SECURITY DEFINER function to bypass RLS safely
CREATE POLICY "GroupUsers: admin access" 
ON public.group_users 
FOR SELECT 
USING (
  public.is_admin()
);

-- 4. Policy: SubAdmin access (Group-scoped)
-- Allows SubAdmins to view other members in their group
CREATE POLICY "GroupUsers: subadmin access" 
ON public.group_users 
FOR SELECT 
USING (
  public.is_group_subadmin(group_id)
);

-- OPTIONAL: Ensure the functions are set up correctly with SECURITY DEFINER
ALTER FUNCTION public.is_admin() SECURITY DEFINER;
ALTER FUNCTION public.is_subadmin() SECURITY DEFINER;
ALTER FUNCTION public.is_group_subadmin(UUID) SECURITY DEFINER;
