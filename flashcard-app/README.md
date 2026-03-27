# Huy Tutor Flashcard App

Ứng dụng học từ vựng tiếng Anh qua Flashcard — Next.js 14, Supabase, TypeScript.

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <your-repo>
cd flashcard-app
npm install
```

### 2. Cấu hình Supabase

1. Tạo project tại [supabase.com](https://supabase.com)
2. Vào **Settings → API** để lấy:
   - `Project URL`
   - `anon public` key
   - `service_role` key (chỉ dùng server-side)

### 3. Cấu hình biến môi trường

```bash
cp .env.example .env.local
```

Điền vào `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Chạy SQL Schema

1. Vào Supabase Dashboard → **SQL Editor**
2. Copy toàn bộ nội dung file `supabase/schema.sql`
3. Paste và chạy

### 5. Tạo Admin Account

1. Vào Supabase Dashboard → **Authentication → Users**
2. Click **Add User**:
   - Email: `admin@example.com`
   - Password: `Admin@123`
   - ✅ Auto-confirm email
3. Sau khi tạo xong, chạy SQL sau để promote thành admin:

```sql
update public.users set role = 'ADMIN' where email = 'admin@example.com';
```

### 6. Chạy local

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000)

---

## 📁 Cấu trúc thư mục

```
flashcard-app/
├── app/
│   ├── (public)/          # Landing, Decks explorer, Demo
│   ├── (auth)/            # Login, Register
│   ├── (dashboard)/       # Dashboard, Profile, Learning workspace
│   ├── (admin)/           # Admin panel (users, decks, analytics)
│   └── api/               # API routes (demo, full deck, admin actions)
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── common/            # SiteHeader, DeckCard, Providers
│   └── flashcard/         # FlashcardPlayer (core learning component)
├── features/auth/         # Zustand store (UI mode)
├── hooks/                 # useAuth, useDecks, use-toast
├── services/supabase/     # client, server, admin clients
├── lib/                   # utils, constants
├── types/                 # TypeScript types
├── middleware.ts           # Auth + role protection
└── supabase/schema.sql    # Full DB schema + RLS + seed data
```

---

## 🧩 Tính năng

### Public (không cần login)
- Landing page với CTA
- Deck Explorer (danh sách bộ đề)
- Demo Learning: xem thử tối đa 10 thẻ/deck

### User (cần login)
- Dashboard: thống kê cá nhân (streak, tiến độ, số từ đã học)
- Learning Workspace: flip card, TTS, sidebar unit/từ vựng
- Profile: xem thông tin, đổi mật khẩu
- Phân quyền: deck còn hạn → full; hết hạn → 10 thẻ

### Admin Panel
- User management: tạo, reset password, gán deck
- Deck management: CRUD deck + flashcard
- Bulk upload: CSV (users), JSON (flashcards)
- Analytics: số user, deck phổ biến, tiến độ TB

---

## 🎨 UI Features

- **Standard Mode**: giao diện tối giản, màu đỏ thương hiệu
- **Kid Mode**: font lớn, màu sắc tươi, bo góc nhiều hơn
- Toggle lưu vào localStorage (Zustand persist)
- Responsive: Mobile / Tablet / Desktop

---

## 🔊 Text-to-Speech

Ưu tiên theo thứ tự:
1. Free Dictionary API (giọng Mỹ chuẩn)
2. Merriam-Webster audio
3. Browser Web Speech API (fallback)
4. Timeout 5 giây mỗi nguồn

---

## 🔐 Bảo mật

- Row Level Security (RLS) cho tất cả bảng
- Middleware kiểm tra auth + role
- `service_role_key` chỉ dùng server-side (API routes)
- Session cookie tự động hết hạn sau 3 ngày không hoạt động

---

## 🚢 Deploy lên Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Thêm environment variables trong Vercel Dashboard:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
```

---

## 📦 JSON Format cho Flashcards

Khi upload qua Admin Panel, file JSON phải có dạng array:

```json
[
  {
    "id": "unit-1",
    "label": "Unit 1 — Tên chủ đề",
    "desc": "Mô tả ngắn về unit này",
    "vocabulary": [
      {
        "word": "exacerbate",
        "phonetic": "/ɪɡˈzæs.ə.beɪt/",
        "meaning": "làm trầm trọng thêm",
        "type": "Verb",
        "example": "The situation was exacerbated by the delay.",
        "translation": "Tình huống bị làm tệ hơn bởi sự chậm trễ.",
        "synonyms": ["aggravate", "worsen"],
        "antonyms": ["alleviate", "improve"],
        "cefr": "C1"
      }
    ]
  }
]
```

## 📋 CSV Format cho Users

```csv
email,role
user1@example.com,USER
user2@example.com,USER
teacher@example.com,ADMIN
```

---

© Huy Tutor — [www.huytutor.io.vn](https://www.huytutor.io.vn)
