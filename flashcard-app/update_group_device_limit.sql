-- Cập nhật bảng groups: Thêm giới hạn thiết bị tối đa cho mỗi user trong nhóm
ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS max_device_per_user INTEGER NOT NULL DEFAULT 3;

-- Cập nhật ghi chú (nếu có)
COMMENT ON COLUMN public.groups.max_device_per_user IS 'Giới hạn số thiết bị tối đa cho mỗi user trong nhóm';
