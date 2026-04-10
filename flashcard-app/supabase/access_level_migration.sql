-- ============================================================
-- Migration: access_level from TEXT to JSONB
-- ============================================================

-- 1. Đổi tên cột cũ
ALTER TABLE public.decks RENAME COLUMN access_level TO access_level_old;

-- 2. Thêm cột mới dạng JSONB
-- Default: Authorized = true (an toàn nhất)
ALTER TABLE public.decks ADD COLUMN access_level JSONB NOT NULL DEFAULT '{"public": false, "authenticated": false, "authorized": true, "preview": false}';

-- 3. Migrate dữ liệu sang format mới
UPDATE public.decks 
SET access_level = jsonb_build_object(
    'public',        (access_level_old = 'public'),
    'authenticated', (access_level_old = 'authenticated'),
    'authorized',    (access_level_old IN ('authorized', 'preview')),
    'preview',       (access_level_old = 'preview')
);

-- 4. Xóa cột cũ
ALTER TABLE public.decks DROP COLUMN access_level_old;

-- 5. Cập nhật schema.sql (nếu người dùng chạy lại schema từ đầu)
-- Chỉnh sửa này cần được phản ánh trong file schema.sql chính nữa.
