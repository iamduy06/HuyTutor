-- ============================================================
-- SQL: CẤU HÌNH NHÓM HỆ THỐNG VÀ TRIGGER TỰ ĐỘNG PHÂN NHÓM
-- ============================================================

-- 1. Tạo các nhóm hệ thống (nếu chưa tồn tại)
INSERT INTO public.groups (name, description, max_users)
VALUES 
  ('SYSTEM_ADMIN_CREATED', 'Nhóm hệ thống chứa người dùng do Admin tạo', 999999),
  ('SYSTEM_REGISTERED', 'Nhóm hệ thống chứa người dùng tự đăng ký', 999999)
ON CONFLICT DO NOTHING;

-- 2. Cập nhật hàm xử lý User mới để tự động phân nhóm
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_group_id UUID;
  v_role TEXT;
  v_is_admin_created BOOLEAN;
  v_skip_system BOOLEAN;
BEGIN
  -- Lấy role và các flag từ metadata
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'USER');
  v_is_admin_created := (NEW.raw_user_meta_data->>'created_by_admin')::BOOLEAN;
  v_skip_system := (NEW.raw_user_meta_data->>'skip_system_group')::BOOLEAN;

  -- A. Insert profile vào public.users
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, v_role)
  ON CONFLICT (id) DO UPDATE 
  SET email = EXCLUDED.email;

  -- B. Tự động phân nhóm tỉ lệ theo cách tạo user (Bỏ qua nếu có flag skip_system_group)
  IF v_skip_system IS TRUE THEN
    v_group_id := NULL;
  ELSIF v_is_admin_created = true THEN
    SELECT id INTO v_group_id FROM public.groups WHERE name = 'SYSTEM_ADMIN_CREATED' LIMIT 1;
  ELSE
    SELECT id INTO v_group_id FROM public.groups WHERE name = 'SYSTEM_REGISTERED' LIMIT 1;
  END IF;

  -- C. Insert vào group_users
  IF v_group_id IS NOT NULL THEN
    INSERT INTO public.group_users (group_id, user_id, is_subadmin)
    VALUES (v_group_id, NEW.id, false)
    ON CONFLICT (group_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Đảm bảo Trigger được gán chính xác
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Lưu ý: Sau khi chạy script này, mọi User mới sẽ tự động được gán vào 1 trong 2 nhóm hệ thống.
