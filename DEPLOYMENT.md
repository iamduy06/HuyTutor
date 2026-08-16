# 🚀 DEPLOYMENT GUIDE — Flashcard App

## Kiến trúc tổng quan

```
flashcard.huytutor.edu.vn  →  Vercel (Next.js Frontend /web)
                                     ↕ REST API (Bearer Token)
                           [Render] (Express Backend /api)
                                     ↕ Admin/Anon Client
                              [Supabase] (PostgreSQL + Auth)
```

---

## 1. Cấu trúc thư mục Monorepo

```
WebFlashcard/
├── api/                   # 🚀 Backend (Express.js + TypeScript) → Deploy lên Render
│   ├── src/
│   │   ├── routes/        # Tất cả API routes (/api/*)
│   │   ├── middleware/    # Auth (JWT), CORS, Error handling
│   │   └── lib/           # Supabase admin/anon clients, utils
│   ├── render.yaml        # Blueprint cấu hình Render
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── web/                   # 🌐 Frontend (Next.js 14 App Router) → Deploy lên Vercel
│   ├── app/               # Next.js pages & layouts
│   ├── components/        # UI components
│   ├── lib/
│   │   └── api-client.ts  # Client tập trung gọi sang Backend
│   ├── package.json
│   └── .env.example
│
├── .gitignore             # Root gitignore bảo vệ secrets & build artifacts
└── DEPLOYMENT.md          # Tài liệu hướng dẫn deploy
```

---

## 2. Chuẩn bị Supabase

1. Vào [supabase.com](https://supabase.com) → chọn project
2. **Project Settings → API** → lấy:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` → `SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ (chỉ dùng ở Backend)

---

## 3. Deploy Backend lên Render

### a) Tạo Web Service mới
1. [render.com](https://render.com) → New → **Web Service**
2. Connect GitHub repo `WebFlashcard` → chọn branch `main`
3. Cài đặt:
   - **Root Directory**: `api`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: `Node`

### b) Cấu hình Environment Variables (Render Dashboard)

```bash
NODE_ENV=production
PORT=4000
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ALLOWED_ORIGINS=https://flashcard.huytutor.edu.vn,http://localhost:3000
```

### c) Lấy URL Backend sau khi deploy
Ví dụ: `https://flashcard-api.onrender.com`

### d) Test health check
```bash
curl https://flashcard-api.onrender.com/health
# → {"status":"ok","timestamp":"..."}
```

---

## 4. Deploy Frontend lên Vercel

### a) Import project
1. [vercel.com](https://vercel.com) → Import từ GitHub repo `WebFlashcard`
2. **Framework Preset**: Next.js
3. **Root Directory**: `web`

### b) Cấu hình Custom Domain
- Settings → Domains → Add `flashcard.huytutor.edu.vn`
- Cập nhật DNS CNAME theo hướng dẫn Vercel

### c) Environment Variables (Vercel Dashboard)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=https://flashcard-api.onrender.com
```

> ⚠️ **KHÔNG** đặt `SUPABASE_SERVICE_ROLE_KEY` vào Vercel. Secret key chỉ thuộc về Backend.

---

## 5. Bảng biến môi trường đầy đủ

### `api/.env` (Render / Backend)

| Biến | Bắt buộc | Mô tả |
|------|-----------|-------|
| `PORT` | Có | `4000` |
| `NODE_ENV` | Có | `production` / `development` |
| `SUPABASE_URL` | Có | URL Supabase project |
| `SUPABASE_ANON_KEY` | Có | Anon key công khai |
| `SUPABASE_SERVICE_ROLE_KEY` | Có | Service role key (bí mật) |
| `ALLOWED_ORIGINS` | Có | Danh sách origins cho phép CORS |

### `web/.env.local` (Vercel / Frontend)

| Biến | Bắt buộc | Mô tả |
|------|-----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Có | URL Supabase (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Có | Anon key (public) |
| `NEXT_PUBLIC_API_URL` | Có | URL Backend Render (public) |

---

## 6. Chạy Local Development

```bash
# 1. Chạy Backend (Terminal 1)
cd api
npm install
npm run dev
# Backend chạy tại http://localhost:4000

# 2. Chạy Frontend (Terminal 2)
cd web
npm install
npm run dev
# Frontend chạy tại http://localhost:3000
```
