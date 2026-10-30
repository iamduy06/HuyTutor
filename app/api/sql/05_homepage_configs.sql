-- =============================================================================
-- 05_HOMEPAGE_CONFIGS.SQL - CẤU HÌNH ĐỘNG 6 KHỐI HOMEPAGE & CMS
-- Huy Tutor (huytutor.edu.vn)
-- =============================================================================

-- 1. Bổ sung các key cấu hình vào bảng public.site_configs
INSERT INTO public.site_configs (key, value, description)
VALUES
-- 1. Khung Đen (Hero Header)
(
    'homepage_hero',
    '{
        "mode": "structured",
        "custom_html": "",
        "subtitle": "Thầy Huy biên soạn: Sách tài liệu tiếng Anh",
        "title": "Chuẩn mực & Chi tiết",
        "bullets": [
            "Cập nhật cấu trúc đề thi mới nhất",
            "Giải thích chi tiết từng câu hỏi & từng phương án",
            "Bổ sung bảng từ vựng mở rộng phong phú",
            "Hỗ trợ 2 định dạng chủ lực: File Word & File PDF"
        ],
        "badge_left": "CHUẨN MỰC",
        "badge_right": "CHI TIẾT",
        "author_avatar_url": "/favicon.png",
        "author_name": "Thầy Huy Tutor",
        "author_title": "Tác giả biên soạn",
        "is_active": true
    }'::jsonb,
    'Cấu hình Khung Đen: Hero Top Trang chủ'
),

-- 2. Khung Xanh Dương (Top Banner 90 đề)
(
    'homepage_top_banner',
    '{
        "mode": "structured",
        "custom_html": "",
        "tag": "HUY TUTOR",
        "title": "Combo 90 ĐỀ THI THỬ",
        "subtitle": "KỲ THI TỐT NGHIỆP THPT MÔN TIẾNG ANH",
        "cta_badge": "CƠ BẢN + NÂNG CAO",
        "link_url": "/combo-thpt",
        "header_label": "Mới ra mắt: 90 đề thi thử từ cơ bản đến nâng cao",
        "books": [
            { "title": "THỰC CHIẾN ĐỀ THI THPT", "badge": "B1-B2", "gradient": "from-orange-500 via-pink-600 to-purple-700" },
            { "title": "ĐỘT PHÁ ĐỀ THI THPT", "badge": "B2-C2", "gradient": "from-amber-700 via-red-800 to-stone-900" },
            { "title": "BỘ ĐỀ CHUẨN CẤU TRÚC", "badge": "B1-C1", "gradient": "from-indigo-900 via-blue-800 to-emerald-600" }
        ],
        "is_active": true
    }'::jsonb,
    'Cấu hình Khung Xanh: Banner 90 đề thi thử'
),

-- 3. Khung Vàng (Danh mục sản phẩm cấp 1)
(
    'homepage_categories_grid',
    '{
        "title": "Danh mục sản phẩm",
        "items": [
            { "id": "cat-1", "category_slug": "flashcard", "label": "Flashcard", "icon_code": "+", "image_url": "", "to": "/flashcard", "is_active": true },
            { "id": "cat-2", "category_slug": "combo-thpt", "label": "Combo THPT", "icon_code": "%", "image_url": "", "to": "/combo-thpt", "is_active": true },
            { "id": "cat-3", "category_slug": "high-school", "label": "Cấp THPT", "icon_code": "12", "image_url": "", "to": "/high-school", "is_active": true },
            { "id": "cat-4", "category_slug": "secondary-school", "label": "Cấp THCS", "icon_code": "9", "image_url": "", "to": "/secondary-school", "is_active": true },
            { "id": "cat-5", "category_slug": "gifted-students", "label": "Bồi dưỡng HSG", "icon_code": "A+", "image_url": "", "to": "/gifted-students", "is_active": true },
            { "id": "cat-6", "category_slug": "template", "label": "Tiện ích giảng dạy", "icon_code": "≡", "image_url": "", "to": "/flashcard", "is_active": true }
        ],
        "is_active": true
    }'::jsonb,
    'Cấu hình Khung Vàng: 6 ô vuông danh mục cấp 1'
),

-- 4. Khung Tím (Nhóm cấp 1 & Các sản phẩm cấp 2 có cấu hình riêng)
(
    'homepage_section_groups',
    '{
        "sections": [
            {
                "id": "sec-thpt",
                "category_slug": "high-school",
                "title": "Tài liệu THPT",
                "is_active": true,
                "sort_order": 1,
                "items": [
                    {
                        "id": "item-thpt-1",
                        "display_title": "20 đề thi thử ngôn ngữ Anh - Đánh giá năng lực Bộ Công an",
                        "image_url": "https://lh7-us.googleusercontent.com/sitesv-images-rt/AMxu72tNyXDWQYtHUFJH_2KV1n1twU4Q1Rg0GG8JQCGASVCrTxcnWeVwXyR7MTu4Xm3mFmJS7505nrmIUkIc9Ad3-MYrQU7r10joFqtl9SLU5T_KsD4CBM_qO8tKu4npy-JEZFgru_UWX9j4t8sYzQGvX57xIKV3tGZYeCVNVW0TC-8c_Li3mEhzLSDutP1JKJSFJH4pnBdREPQkTmdpoxuW_2RJar0lbq5ozCxbTgjJeVs",
                        "target_url": "/high-school/dgnlbca",
                        "badge_text": "Mới",
                        "tag_text": "Luyện từ cơ bản đến nâng cao",
                        "is_active": true,
                        "sort_order": 1
                    },
                    {
                        "id": "item-thpt-2",
                        "display_title": "Đột phá đề thi THPTQG môn Tiếng Anh (B2 - C2)",
                        "image_url": "https://lh7-us.googleusercontent.com/sitesv-images-rt/AMxu72tkr2hYh29g3F-B-ZgGZ0d7YwSjC8vH-l01Q7fC9m_w-1eD1",
                        "target_url": "/high-school",
                        "badge_text": "Hot",
                        "tag_text": "Dành cho kỳ thi THPTQG từ năm 2025",
                        "is_active": true,
                        "sort_order": 2
                    },
                    {
                        "id": "item-thpt-3",
                        "display_title": "Bộ đề chuẩn cấu trúc (B1 - C1)",
                        "image_url": "https://lh7-us.googleusercontent.com/sitesv-images-rt/AMxu72s5U8t6V5w_b8C1x7-c9L_p3-d2",
                        "target_url": "/high-school",
                        "badge_text": "Bán chạy",
                        "tag_text": "Dành cho Kỳ thi THPTQG từ năm 2025",
                        "is_active": true,
                        "sort_order": 3
                    }
                ]
            }
        ]
    }'::jsonb,
    'Cấu hình Khung Tím: Nhóm cấp 1 và từng sản phẩm con cấp 2 (đặt tên riêng, ảnh riêng, active/inactive)'
),

-- 5. Dòng Chữ Xám
(
    'homepage_notice_text',
    '{
        "text": "Không chỉ có các bộ đề chất lượng, thầy Huy còn biên soạn rất nhiều tài liệu bổ trợ khác như chuyên đề điền từ, cụm từ cố định, từ vựng SGK,...",
        "cta_button_text": "Xem toàn bộ",
        "cta_button_link": "/high-school",
        "is_active": true
    }'::jsonb,
    'Cấu hình Dòng Chữ Xám thông báo'
),

-- 6. Khung Nâu (Bottom Banner CT GDPT 2018)
(
    'homepage_bottom_banner',
    '{
        "mode": "structured",
        "custom_html": "",
        "custom_image_url": "",
        "link_url": "/high-school",
        "tag": "HUY TUTOR",
        "title": "TÀI LIỆU TIẾNG ANH",
        "badge_text": "CT GDPT 2018",
        "books": [
            { "title": "ĐỘT PHÁ ĐỀ THI", "year": "2026", "gradient": "from-amber-700 via-red-800 to-stone-900" },
            { "title": "THỰC CHIẾN ĐỀ THI", "year": "2026", "gradient": "from-orange-500 via-pink-600 to-purple-700" }
        ],
        "is_active": true
    }'::jsonb,
    'Cấu hình Khung Nâu: Banner cuối trang'
)
ON CONFLICT (key) DO NOTHING;
