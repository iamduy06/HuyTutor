-- FIX INFINITE RECURSION IN RLS

-- 1. Xóa các function cũ để viết lại (tránh xung đột)
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_subadmin() CASCADE;
DROP FUNCTION IF EXISTS public.is_group_subadmin(UUID) CASCADE;

-- 2. Viết lại is_admin với chuẩn SECURITY DEFINER và SET search_path, 
-- và sử dụng bảng auth.users metadata NẾU có, hoặc bypass RLS an toàn.
-- Để bypass RLS 100%, chúng ta không nên để Postgres tự động optimize.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public
AS $$
  -- Truy vấn bảng users sẽ an toàn nếu function này do postgres (superuser) tạo ra
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$;

-- Đảm bảo chức năng Owner thuộc về postgres - nhóm có quyền Bypass RLS
ALTER FUNCTION public.is_admin() OWNER TO postgres;

-- Làm tương tự cho subadmin
CREATE OR REPLACE FUNCTION public.is_subadmin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_users WHERE user_id = auth.uid() AND is_subadmin = true
  );
$$;
ALTER FUNCTION public.is_subadmin() OWNER TO postgres;

CREATE OR REPLACE FUNCTION public.is_group_subadmin(group_uuid UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_users
    WHERE group_id = group_uuid AND user_id = auth.uid() AND is_subadmin = true
  );
$$;
ALTER FUNCTION public.is_group_subadmin(UUID) OWNER TO postgres;

-- 3. Tạo lại các chính sách cho AN TOÀN bằng cách TÁCH RA THAY VÌ GỘP OR
DROP POLICY IF EXISTS "Users: view own" ON public.users;
DROP POLICY IF EXISTS "Admin All: users" ON public.users;

-- Policy 1: User luôn ĐƯỢC thấy chính tài khoản của họ MÀ KHÔNG CẦN TÍNH TOÁN RLS ĐỆ QUY
CREATE POLICY "Users: view own" ON public.users FOR SELECT USING (
  auth.uid() = id
);

-- Policy 2: Admin có đặc quyền (Admin truy cập vào nó sẽ gọi is_admin, 
-- bên trong is_admin là SECURITY DEFINER do postgres sở hữu nên nó sẽ tự động bypass được RLS).
CREATE POLICY "Admin All: view users" ON public.users FOR SELECT USING (
  public.is_admin()
);

-- Policy 3: SubAdmin theo group
CREATE POLICY "Subadmin: view group users" ON public.users FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.group_users gu1
    JOIN public.group_users gu2 ON gu1.group_id = gu2.group_id
    WHERE gu1.user_id = auth.uid() AND gu1.is_subadmin = true AND gu2.user_id = public.users.id
  )
);

-- BẢO VỆ DỮ LIỆU: Nếu lúc Insert lại data từ Auth bạn bị thiếu Role, hãy cập nhật lại ngay
UPDATE public.users 
SET role = 'ADMIN' 
-- Thay email thành email của Admin nhé:
WHERE email = 'tuanhuy@gmail.com'; 
