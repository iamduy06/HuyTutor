# DỰ ÁN CRAWL & TÁI CẤU TRÚC WEBSITE HUY TUTOR (`huytutor.edu.vn`)

Dự án thu thập toàn bộ dữ liệu trang web Huy Tutor (nguồn gốc: `https://www.huytutor.io.vn/`), phân tích cấu trúc trang và triển khai đầy đủ mã nguồn hệ thống thương mại điện tử tài liệu số tự động hóa trên tên miền chính thức: **`https://huytutor.edu.vn`**.

---

## Kiến trúc Mã nguồn Chính thức (`app/`)

Toàn bộ mã nguồn Production được đặt trong thư mục `app/` theo cấu trúc tách biệt Backend & Frontend, đảm bảo **100% luồng dữ liệu liên quan đến Database đều bắt buộc đi qua Backend (`app/api`)**:

- **`app/api/` (Backend API - Deploy trên Render - `https://api.huytutor.edu.vn`)**:
  - Kết nối độc quyền tới Database Supabase PostgreSQL bằng `SUPABASE_SERVICE_ROLE_KEY` (hoặc cơ sở dữ liệu JSON đồng bộ tại Backend khi chạy local).
  - Cung cấp các REST API:
    - `/api/catalog/init`, `/api/catalog/products`, `/api/catalog/products/:slug`, `/api/catalog/categories/:slug`
    - `/api/orders` (Kiểm tra xác thực Gmail 2 lớp, kiểm tra quy tắc **Single-Format Checkout**, tự động tính chiết khấu Combo từ bảng `combo_rules`, tạo mã đơn `HTxxxxx`).
    - `/api/webhook/sepay`, `/api/webhook/paypal`, `/api/webhook/simulate-payment` (Nhận Webhook thanh toán tự động và bắn 14 Entry vào Google Form nội bộ `1FAIpQLSdz1BLDnkEDLz0fWfhkLhB6SknNSVFUI6UDsLU2cEvIKTVN2Q`).
    - `/api/admin/*` (CRUD Sản phẩm, 5 Định dạng & Giá bán, Presigned URL tải ảnh bìa Thumbnail & PDF lên Cloudflare R2 `media.huytutor.edu.vn`, đóng dấu Watermark PDF bằng `pdf-lib`, đối soát và bắn lại Google Form).
- **`app/web/` (Frontend Web App - Deploy trên Vercel - `https://huytutor.edu.vn`)**:
  - Xây dựng bằng React 18 + TypeScript + Vite + Tailwind CSS.
  - **Tuyệt đối không kết nối trực tiếp vào Database**: 100% dữ liệu Menu, Danh mục, Sản phẩm, Định dạng, Đơn hàng và Quản trị Admin đều gọi qua `app/web/src/api/client.ts` tới Backend (`app/api`).
  - Tuân thủ nghiêm ngặt chuẩn giao diện 1:1 theo 5 ảnh mẫu: màu chủ đạo `#e60049`, bo góc nhẹ `rounded-md` cho khung thẻ và `rounded-sm` cho nút bấm, **không chèn icon vào trong nút bấm**, không dùng emoji trang trí rườm rà.

### Cách chạy hệ thống (`app/api` & `app/web`):
```bash
# 1. Chạy Backend API (Port 4000)
cd app/api
npm install
npm run dev

# 2. Chạy Frontend Web App (Port 5173)
cd app/web
npm install
npm run dev
```

---

## Cấu trúc Thư mục Dự án

- **`app/`**: Mã nguồn Production đầy đủ (`app/api` và `app/web`).
- **`huytutor.io.vn/`**: Thư mục lưu trữ toàn bộ **39 trang web** đã crawl về từ `https://www.huytutor.io.vn/`.
- **`demo/`**: Thư mục giao diện HTML tĩnh mẫu đối chiếu trực quan (`http://localhost:3000/`).
- **`docs/`**: Thư mục tài liệu báo cáo và thiết kế kiến trúc:
  - [`docs/01-bao-cao-cau-truc-cac-trang.md`](docs/01-bao-cao-cau-truc-cac-trang.md): Báo cáo chi tiết về 6 mẫu trang tương đương (Page Archetypes), ma trận đối sánh cấu trúc, luồng vận hành hiện tại và hạn chế kỹ thuật của Google Sites.
  - [`docs/02-ke-hoach-cai-tien-va-xay-dung-lai-website.md`](docs/02-ke-hoach-cai-tien-va-xay-dung-lai-website.md): Bản thiết kế toàn diện hệ thống mới theo kiến trúc **Zero-Hardcode & 100% Database qua Backend (`app/api`)**.
  - [`docs/03-huong-dan-trien-khai-chi-tiet-tung-buoc.md`](docs/03-huong-dan-trien-khai-chi-tiet-tung-buoc.md): **Sổ tay thực thi kỹ thuật từng bước (Developer Runbook & Execution Playbook)** gồm 7 giai đoạn từ A-Z.
  - [`docs/04-huong-dan-lay-key-va-cau-hinh-online.md`](docs/04-huong-dan-lay-key-va-cau-hinh-online.md): **Cẩm nang hướng dẫn chi tiết cách lấy tất cả API Key và cấu hình Online từ A-Z** (Supabase, Cloudflare R2, SePay VietQR, PayPal, Google Form 14 Entries, Render, Vercel, UptimeRobot và bảng DNS Cloudflare).
  - [`docs/05-ke-hoach-trien-khai-dang-nhap-va-phan-quyen-user-admin.md`](docs/05-ke-hoach-trien-khai-dang-nhap-va-phan-quyen-user-admin.md): **Kế hoạch toàn diện: Triển khai Hệ thống Xác thực & Phân quyền (Role User & Admin)**, cấu hình Database Supabase, Backend API, Frontend State & Tủ sách cá nhân (My Library).
