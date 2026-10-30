-- =============================================================================
-- 04_SITE_CONFIGS.SQL - CẤU HÌNH HỆ THỐNG & ĐỒNG BỘ 12 MENU HEADER ĐA CẤP
-- Huy Tutor (huytutor.edu.vn)
-- =============================================================================

-- 1. BẢNG CẤU HÌNH HỆ THỐNG (SITE_CONFIGS)
-- Quản lý các cấu hình động như: liên kết mạng xã hội Footer, liên kết chính sách...
CREATE TABLE IF NOT EXISTS public.site_configs (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Bật Row Level Security cho site_configs
ALTER TABLE public.site_configs ENABLE ROW LEVEL SECURITY;

-- Cho phép đọc công khai (để khách hàng truy cập website xem được cấu hình Footer)
DROP POLICY IF EXISTS "Public read site_configs" ON public.site_configs;
CREATE POLICY "Public read site_configs" ON public.site_configs
    FOR SELECT USING (true);

-- Cho phép service_role quyền ghi/sửa đầy đủ
DROP POLICY IF EXISTS "Service role full access site_configs" ON public.site_configs;
CREATE POLICY "Service role full access site_configs" ON public.site_configs
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- 2. DỮ LIỆU CẤU HÌNH BAN ĐẦU CHO MẠNG XÃ HỘI & CHÍNH SÁCH FOOTER
INSERT INTO public.site_configs (key, value, description)
VALUES
(
    'footer_social_links',
    '[
        {"id": "facebook", "platform": "facebook", "label": "Facebook Huy Tutor", "url": "https://facebook.com", "icon": "f", "is_active": true},
        {"id": "youtube", "platform": "youtube", "label": "YouTube Huy Tutor", "url": "https://youtube.com", "icon": "▶", "is_active": true}
    ]'::jsonb,
    'Danh sách đường dẫn mạng xã hội hiển thị tại Footer'
),
(
    'footer_policy_links',
    '[
        {"id": "terms", "label": "Điều khoản sử dụng", "url": "/terms-of-service", "order_index": 1, "is_active": true},
        {"id": "privacy", "label": "Chính sách bảo mật", "url": "/terms-of-service", "order_index": 2, "is_active": true},
        {"id": "faq", "label": "Chính sách thanh toán & FAQ", "url": "/faq", "order_index": 3, "is_active": true},
        {"id": "donate", "label": "Ủng hộ tác giả (Donate)", "url": "/donate", "order_index": 4, "is_active": true}
    ]'::jsonb,
    'Danh sách liên kết chính sách & điều khoản hiển thị tại Footer'
)
ON CONFLICT (key) DO NOTHING;

-- 3. ĐỒNG BỘ TOÀN DIỆN 12 MENU HEADER VÀ SUBMENUS VÀO NAVIGATION_MENUS & NAVIGATION_ITEMS
INSERT INTO public.navigation_menus (id, title, url, order_index, is_active) VALUES
(1, 'TRANG CHỦ', '/', 1, true),
(2, 'FLASHCARD', '/flashcard', 2, true),
(3, 'COMBO THPT', '/combo-thpt', 3, true),
(4, 'TÀI LIỆU THPT', '/high-school', 4, true),
(5, 'TÀI LIỆU THCS', '/secondary-school', 5, true),
(6, 'TÀI LIỆU HSG', '/gifted-students', 6, true),
(7, 'SOẠN TÀI LIỆU', '/soan-tai-lieu', 7, true),
(8, 'TÀI LIỆU KHÁC', '/other', 8, true),
(9, 'MẪU', '/template', 9, true),
(10, 'TÀI LIỆU MIỄN PHÍ', '/gifts', 10, true),
(11, 'HC REWARDS', '/hc-rewards', 11, true),
(12, 'CÂU HỎI THƯỜNG GẶP', '/faq', 12, true)
ON CONFLICT (id) DO UPDATE 
SET title = EXCLUDED.title, url = EXCLUDED.url, order_index = EXCLUDED.order_index, is_active = EXCLUDED.is_active;

-- Đồng bộ chi tiết các menu con (Submenus)
DELETE FROM public.navigation_items WHERE menu_id IN (4, 5, 6, 8, 9, 10);

INSERT INTO public.navigation_items (menu_id, label, url, order_index, is_highlight) VALUES
-- Submenu cho TÀI LIỆU THPT (menu_id: 4)
(4, 'Tất cả tài liệu THPT', '/high-school', 1, false),
(4, '30 Đề ĐGNL Bộ Công An', '/high-school/dgnlbca', 2, true),
(4, 'Đột phá đề thi THPTQG (B2-C2)', '/high-school#de-thi-thu', 3, false),
(4, 'Tuyển tập từ vựng 10, 11, 12', '/high-school#tu-vung-gs', 4, false),

-- Submenu cho TÀI LIỆU THCS (menu_id: 5)
(5, 'Tất cả tài liệu THCS', '/secondary-school', 1, false),
(5, 'Đọc điền - Đọc hiểu Lớp 9', '/secondary-school/reading-g9', 2, true),
(5, 'Đọc điền - Đọc hiểu Lớp 6, 7, 8', '/secondary-school#lop-8', 3, false),

-- Submenu cho TÀI LIỆU HSG (menu_id: 6)
(6, '1400 Cụm Động Từ HSG', '/gifted-students/1400caucumdongtuintermediate', 1, true),

-- Submenu cho TÀI LIỆU KHÁC (menu_id: 8)
(8, 'Chuyên đề Điền từ', '/other#dien-tu', 1, false),
(8, 'Chuyên đề Ngữ pháp trọng tâm', '/other#ngu-phap', 2, false),
(8, 'Bảng từ vựng tổng hợp', '/other#tu-vung', 3, false),

-- Submenu cho MẪU (menu_id: 9)
(9, 'Mẫu Kế hoạch bài dạy (Giáo án)', '/template#giao-an', 1, false),
(9, 'Mẫu Đề thi theo ma trận', '/template#de-thi', 2, false),
(9, 'Mẫu Bảng kiểm đánh giá', '/template#bang-kiem', 3, false),

-- Submenu cho TÀI LIỆU MIỄN PHÍ (menu_id: 10)
(10, 'Đề thi học kỳ miễn phí', '/gifts#de-thi', 1, false),
(10, 'Cẩm nang từ vựng miễn phí', '/gifts#cam-nang', 2, false),
(10, 'Tài liệu đọc thử trích đoạn', '/gifts#doc-thu', 3, false);

