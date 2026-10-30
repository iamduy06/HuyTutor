-- =============================================================================
-- 02_SEED.SQL - DỮ LIỆU MẪU CHUẨN 1:1 HUY TUTOR (HUYTUTOR.EDU.VN)
-- =============================================================================

-- 1. MENU ĐIỀU HƯỚNG HEADER
INSERT INTO navigation_menus (id, title, url, order_index, is_active) VALUES
(1, 'TRANG CHỦ', '/', 1, true),
(2, 'FLASHCARD', '/flashcard', 2, true),
(3, 'COMBO THPT', '/combo-thpt', 3, true),
(4, 'TÀI LIỆU THPT', '/high-school', 4, true),
(5, 'TÀI LIỆU THCS', '/secondary-school', 5, true),
(6, 'TÀI LIỆU HSG', '/gifted-students/1400caucumdongtuintermediate', 6, true),
(7, 'SOẠN TÀI LIỆU', '/#utilities', 7, true),
(8, 'CÂU HỎI THƯỜNG GẶP', '/#faq-section', 8, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO navigation_items (menu_id, label, url, order_index, is_highlight) VALUES
(4, 'Tất cả tài liệu THPT', '/high-school', 1, false),
(4, '30 Đề ĐGNL Bộ Công An', '/high-school/dgnlbca', 2, true),
(4, 'Đột phá đề thi THPTQG (B2-C2)', '/high-school', 3, false),
(4, 'Tuyển tập từ vựng 10, 11, 12', '/high-school', 4, false),
(5, 'Tất cả tài liệu THCS', '/secondary-school', 1, false),
(5, 'Đọc điền - Đọc hiểu Lớp 9', '/secondary-school/reading-g9', 2, true),
(5, 'Đọc điền - Đọc hiểu Lớp 6, 7, 8', '/secondary-school', 3, false),
(6, '1400 Cụm Động Từ HSG', '/gifted-students/1400caucumdongtuintermediate', 1, true);

-- 2. DANH MỤC SẢN PHẨM
INSERT INTO categories (id, name, slug, description, order_index) VALUES
('high-school', 'Danh mục tài liệu Chuẩn mực & Chi tiết cấp THPT', 'high-school', 'Đề thi thử THPT/ĐGNL, Bổ trợ & Từ vựng Global Success', 1),
('secondary-school', 'Danh mục tài liệu Chuẩn mực & Chi tiết cấp THCS', 'secondary-school', 'Đọc điền - Đọc hiểu Tiếng Anh Lớp 6, 7, 8, 9 & Ôn thi vào 10', 2),
('gifted-students', 'Danh mục tài liệu Học sinh giỏi & Chuyên Anh', 'gifted-students', 'Tài liệu ôn thi HSG Tỉnh/Quốc gia & Chuyên Anh', 3),
('flashcard', 'Hệ thống Flashcard Từ vựng Trực tuyến', 'flashcard', 'Chủ động - Mọi lúc - Mọi nơi với 4 chế độ luyện tập', 4),
('utilities', 'Mẫu Trang Tính & Tiện ích Soạn Tài Liệu', 'utilities', 'Công cụ quản lý lớp học và soạn đề tự động cho Giáo viên', 5)
ON CONFLICT (id) DO NOTHING;

-- 3. QUY TẮC ƯU ĐÃI COMBO
INSERT INTO combo_rules (id, combo_name, min_items, discount_percent, discount_amount, applicable_format, badge_text, description) VALUES
('combo-2', 'Combo 2 Tài liệu cùng định dạng', 2, 15, 45000, 'ALL', 'GIẢM 15%', 'Tự động giảm 45.000đ khi chọn thanh toán từ 2 tài liệu cùng định dạng'),
('combo-3', 'Combo 3 Bộ Đề Mới Nhất 2026', 3, 20, 85000, 'ALL', 'GIẢM 20%', 'Tự động giảm 85.000đ khi chọn thanh toán từ 3 tài liệu cùng định dạng'),
('combo-5', 'Đại Combo 90 Đề Thi Thử THPTQG', 5, 25, 160000, 'ALL', 'GIẢM 25%', 'Ưu đãi cao nhất giảm 160.000đ khi mua trọn bộ từ 5 tài liệu cùng định dạng')
ON CONFLICT (id) DO NOTHING;
