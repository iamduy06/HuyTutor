-- Migration: Mở rộng cột session_token từ VARCHAR(255) thành TEXT để chứa đầy đủ chuỗi JWT token (HS256 300+ ký tự)
ALTER TABLE public.user_sessions ALTER COLUMN session_token TYPE TEXT;
