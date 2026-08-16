-- ============================================================
-- Seed admin user
-- Run AFTER schema.sql
-- This inserts the admin profile; auth user must be created via Supabase Dashboard
-- or Supabase CLI: supabase auth create-user --email admin@example.com --password Admin@123
-- ============================================================

-- If you used the Supabase Dashboard to create the auth user, find the UUID from:
-- Authentication > Users > admin@example.com
-- Then replace 'REPLACE_WITH_AUTH_USER_UUID' below

-- INSERT INTO public.users (id, email, role)
-- VALUES ('REPLACE_WITH_AUTH_USER_UUID', 'admin@example.com', 'ADMIN')
-- ON CONFLICT (id) DO UPDATE SET role = 'ADMIN';

-- ============================================================
-- Alternatively, use this function to promote any existing user to admin:
-- ============================================================

-- UPDATE public.users SET role = 'ADMIN' WHERE email = 'admin@example.com';
