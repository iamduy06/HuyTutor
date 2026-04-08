# Huy Tutor Flashcard

Nền tảng học từ vựng tiếng Anh chuyên nghiệp với Next.js 14, Supabase và TailwindCSS.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS, shadcn/ui
- **State**: React Query (server state) + Zustand (UI state)
- **Backend**: Supabase (Auth, PostgreSQL, RLS)
- **Deployment**: Vercel

---

## Cài đặt local

### 1. Clone và cài dependencies

```bash
git clone <repo>
cd flashcard-app
npm install
```

### 2. Tạo file `.env.local`

```bash
cp .env.example .env.local
```

Điền vào các giá trị từ Supabase dashboard:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

> ⚠️ **KHÔNG BAO GIỜ** commit `SUPABASE_SERVICE_ROLE_KEY` lên git.

### 3. Setup Supabase

1. Tạo project tại [supabase.com](https://supabase.com)
2. Vào **SQL Editor**, chạy file `supabase/schema.sql`
3. Tạo admin user:
   - Vào **Authentication > Users > Invite user**
   - Email: `admin@example.com`, Password: `Admin@123`
   - Sau đó chạy trong SQL Editor:
     ```sql
     UPDATE public.users SET role = 'ADMIN' WHERE email = 'admin@example.com';
     ```

### 4. Chạy development

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000)

---

## Deploy lên Vercel

```bash
npx vercel
```

Thêm environment variables trong Vercel Dashboard (Settings > Environment Variables):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## Cấu trúc project

```
flashcard-app/
├── app/
│   ├── (public)/          # Landing, Deck Explorer, Demo
│   ├── (auth)/            # Login, Register
│   ├── (dashboard)/       # Dashboard, Profile, Learning
│   ├── (admin)/           # Admin Panel
│   └── api/               # API Routes
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── common/            # Header, Footer, Providers
│   └── flashcard/         # FlashcardPlayer, DeckCard
├── features/auth/         # Zustand stores
├── services/supabase/     # client / server / admin
├── hooks/                 # useUser, use-toast
├── lib/                   # utils, constants
├── types/                 # TypeScript types
├── middleware.ts           # Auth + role middleware
└── supabase/schema.sql    # Full DB schema + RLS + seed
```

---

## Tính năng

### Public (không cần login)
- Landing page với CTA
- Xem danh sách bộ đề
- Học thử demo (tối đa 10 từ)

### User (đăng nhập)
- Dashboard cá nhân với streak, tiến độ
- Học đầy đủ bộ đề (nếu còn hạn)
- Text-to-Speech (Web Speech API + Dictionary API)
- Flip card animation
- Đổi mật khẩu
- UI Mode: Standard / Kid

### Admin
- Quản lý người dùng (tạo, reset password, giao bộ đề, xóa)
- Quản lý bộ đề + flashcard (CRUD)
- Bulk import: CSV (users) + JSON (flashcards)
- Thống kê analytics

---

## Bảo mật

- Row Level Security (RLS) trên tất cả bảng
- Middleware kiểm tra auth + role
- `SUPABASE_SERVICE_ROLE_KEY` chỉ dùng server-side
- Session cookie 3 ngày

---

## Default Admin

```
Email:    admin@example.com
Password: Admin@123
```

> Thay đổi mật khẩu ngay sau khi deploy!
