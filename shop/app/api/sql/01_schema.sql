-- =============================================================================
-- 01_SCHEMA.SQL - CƠ SỞ DỮ LIỆU SUPABASE CHO HỆ THỐNG HUY TUTOR (HUYTUTOR.EDU.VN)
-- Kiến trúc Zero-Hardcode: Toàn bộ Menu, Danh mục, Sản phẩm, 5 Định dạng,
-- Giá bán, Bản đọc thử, Watermark, Specs/Topics/Features đều lưu trong DB
-- =============================================================================

-- 1. BẢNG MENU ĐIỀU HƯỚNG HEADER ĐA CẤP (NAVIGATION_MENUS & NAVIGATION_ITEMS)
CREATE TABLE IF NOT EXISTS navigation_menus (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    url VARCHAR(255) NOT NULL,
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS navigation_items (
    id SERIAL PRIMARY KEY,
    menu_id INT REFERENCES navigation_menus(id) ON DELETE CASCADE,
    label VARCHAR(200) NOT NULL,
    url VARCHAR(255) NOT NULL,
    order_index INT DEFAULT 0,
    is_highlight BOOLEAN DEFAULT FALSE,
    is_external BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. BẢNG DANH MỤC SẢN PHẨM (CATEGORIES)
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. BẢNG SẢN PHẨM CỐT LÕI (PRODUCTS)
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(100) PRIMARY KEY,
    category_id VARCHAR(50) REFERENCES categories(id) ON DELETE SET NULL,
    section_group VARCHAR(100) DEFAULT 'general',
    title VARCHAR(500) NOT NULL,
    short_title VARCHAR(255),
    slug VARCHAR(255) UNIQUE NOT NULL,
    google_form_product_name VARCHAR(500) NOT NULL,
    badge VARCHAR(50) DEFAULT 'Mới',
    subtitle VARCHAR(255) DEFAULT 'Luyện từ cơ bản đến nâng cao',
    cefr_level VARCHAR(50),
    grade VARCHAR(50),
    description TEXT,
    
    -- TÀI NGUYÊN CLOUDFLARE R2 CDN
    r2_thumbnail_url TEXT NOT NULL,
    r2_demo_images_urls JSONB DEFAULT '[]'::jsonb,
    r2_audio_url TEXT,
    
    -- CẤU HÌNH BẢN ĐỌC THỬ (CHỈ HIỂN THỊ 1 TRONG 2 HOẶC ẨN) & WATERMARK BẮT BUỘC
    preview_type VARCHAR(20) DEFAULT 'pdf' CHECK (preview_type IN ('pdf', 'images', 'none')),
    sample_pdf_source VARCHAR(20) DEFAULT 'drive' CHECK (sample_pdf_source IN ('drive', 'r2')),
    sample_pdf_url TEXT,
    sample_title VARCHAR(500),
    watermark_enabled BOOLEAN DEFAULT TRUE,
    watermark_text VARCHAR(255) DEFAULT 'HUY TUTOR - BẢN ĐỌC THỬ MIỄN PHÍ - ZALO 0356999147 - HUYTUTOR.EDU.VN',
    
    -- BỘ 3 TRƯỜNG ĐỘNG DO ADMIN CẤU HÌNH 100% (SPECS, TOPICS, FEATURES)
    specs JSONB DEFAULT '[]'::jsonb,
    topics JSONB DEFAULT '[]'::jsonb,
    features JSONB DEFAULT '[]'::jsonb,
    sample_pages_text JSONB DEFAULT '[]'::jsonb,
    
    is_published BOOLEAN DEFAULT TRUE,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 4. BẢNG 5 ĐỊNH DẠNG & GIÁ RIÊNG CHO TỪNG SẢN PHẨM (PRODUCT_FORMATS)
CREATE TABLE IF NOT EXISTS product_formats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id VARCHAR(100) REFERENCES products(id) ON DELETE CASCADE,
    ui_format_name VARCHAR(50) NOT NULL CHECK (ui_format_name IN ('Word', 'PDF', 'Flashcard', 'Trang tính', 'Thiết kế')),
    form_mapped_note VARCHAR(50) NOT NULL CHECK (form_mapped_note IN ('Word dài', 'PDF dài', 'Flashcard', 'Trang tính', 'Thiết kế')),
    price NUMERIC(12, 0) NOT NULL,
    original_price NUMERIC(12, 0),
    gdrive_folder_id VARCHAR(255),
    drive_url TEXT DEFAULT '',
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT uq_product_ui_format UNIQUE (product_id, ui_format_name)
);

-- 5. BẢNG QUY TẮC ƯU ĐÃI COMBO (COMBO_RULES)
CREATE TABLE IF NOT EXISTS combo_rules (
    id VARCHAR(100) PRIMARY KEY,
    combo_name VARCHAR(255) NOT NULL,
    min_items INT NOT NULL DEFAULT 2,
    discount_percent INT DEFAULT 0,
    discount_amount NUMERIC(12, 0) NOT NULL DEFAULT 0,
    applicable_format VARCHAR(50) DEFAULT 'ALL',
    badge_text VARCHAR(50) DEFAULT 'GIẢM 20%',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 6. BẢNG ĐƠN HÀNG (ORDERS)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    customer_group VARCHAR(100) NOT NULL DEFAULT 'Giáo viên công lập',
    
    -- RÀNG BUỘC THANH TOÁN ĐƠN ĐỊNH DẠNG
    checkout_format VARCHAR(50) NOT NULL CHECK (checkout_format IN ('Word', 'PDF', 'Flashcard', 'Trang tính', 'Thiết kế')),
    mapped_form_note VARCHAR(50) NOT NULL CHECK (mapped_form_note IN ('Word dài', 'PDF dài', 'Flashcard', 'Trang tính', 'Thiết kế')),
    flashcard_quantity INT,
    
    -- TÙY CHỌN XUẤT HÓA ĐƠN VAT (NẾU KHÔNG TICK ĐỂ TRỐNG "")
    need_invoice BOOLEAN DEFAULT FALSE,
    customer_address TEXT DEFAULT '',
    tax_id_or_cccd VARCHAR(100) DEFAULT '',
    
    -- GIÁ TRỊ ĐƠN HÀNG
    original_subtotal NUMERIC(12, 0) NOT NULL,
    combo_discount NUMERIC(12, 0) DEFAULT 0,
    final_amount NUMERIC(12, 0) NOT NULL,
    
    -- CỔNG THANH TOÁN & TRẠNG THÁI
    payment_gateway VARCHAR(50) NOT NULL DEFAULT 'sepay',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    google_form_submitted BOOLEAN DEFAULT FALSE,
    google_form_payload JSONB,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 7. BẢNG CHI TIẾT ĐƠN HÀNG (ORDER_ITEMS)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    order_code VARCHAR(50) REFERENCES orders(order_code) ON DELETE CASCADE,
    product_id VARCHAR(100) REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(500) NOT NULL,
    google_form_product_name VARCHAR(500) NOT NULL,
    ui_format VARCHAR(50) NOT NULL,
    form_format VARCHAR(50) NOT NULL,
    unit_price NUMERIC(12, 0) NOT NULL,
    final_item_price NUMERIC(12, 0) NOT NULL,
    quantity INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 8. BẢNG GIAO DỊCH WEBHOOK (TRANSACTIONS)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code VARCHAR(50) REFERENCES orders(order_code) ON DELETE CASCADE,
    transaction_ref VARCHAR(255),
    bank_code VARCHAR(50),
    amount NUMERIC(12, 0) NOT NULL,
    content TEXT,
    raw_webhook JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 9. BẬT ROW LEVEL SECURITY (RLS) - CHỈ CHO PHÉP BACKEND (SERVICE_ROLE) TRUY CẬP
-- Frontend tuyệt đối không kết nối trực tiếp vào Supabase; 100% luồng dữ liệu đi qua Backend API
ALTER TABLE navigation_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_formats ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Backend service_role full access menus" ON navigation_menus USING (auth.role() = 'service_role');
CREATE POLICY "Backend service_role full access menu items" ON navigation_items USING (auth.role() = 'service_role');
CREATE POLICY "Backend service_role full access categories" ON categories USING (auth.role() = 'service_role');
CREATE POLICY "Backend service_role full access products" ON products USING (auth.role() = 'service_role');
CREATE POLICY "Backend service_role full access formats" ON product_formats USING (auth.role() = 'service_role');
CREATE POLICY "Backend service_role full access combos" ON combo_rules USING (auth.role() = 'service_role');
CREATE POLICY "Backend service_role full access orders" ON orders USING (auth.role() = 'service_role');
CREATE POLICY "Backend service_role full access order_items" ON order_items USING (auth.role() = 'service_role');
CREATE POLICY "Backend service_role full access transactions" ON transactions USING (auth.role() = 'service_role');
