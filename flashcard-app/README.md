# Huy Tutor Flashcard App

Next.js 14 · TypeScript · Supabase · TailwindCSS

---

## 🚀 Setup & Run

### 1. Install
```bash
npm install
```

### 2. Environment
```bash
cp .env.example .env.local
# Fill in your Supabase URL and keys
```

`.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Database
1. Supabase Dashboard → SQL Editor → paste `supabase/schema.sql` → Run

### 4. Create Admin
1. Supabase → Authentication → Users → Add User:
   - Email: `admin@example.com`
   - Password: `Admin@123`
   - ✅ Auto-confirm email
2. Run in SQL Editor:
```sql
update public.users set role = 'ADMIN' where email = 'admin@example.com';
```

### 5. Run
```bash
npm run dev
# → http://localhost:3000
```

---

## 🔑 Auth Fix — What Was Wrong

The original project had 3 bugs causing silent login failure:

| Bug | File | Fix |
|-----|------|-----|
| `setAll` recreated `NextResponse` losing cookies | `middleware.ts` | Never reassign inside `setAll` |
| `router.push` before `router.refresh` | `login/page.tsx` | Call `refresh()` first |
| `useSearchParams` without `Suspense` | `login/page.tsx` | Wrap in `<Suspense>` |

---

## 📦 JSONB Format

Flashcard `content` column accepts **both** formats:

**Single unit (object):**
```json
{
  "id": "unit-1",
  "label": "Unit 1",
  "desc": "Description",
  "vocabulary": [{ "word": "...", ... }]
}
```

**Multiple units (array):**
```json
[
  { "id": "unit-1", "label": "Unit 1", "vocabulary": [...] },
  { "id": "unit-2", "label": "Unit 2", "vocabulary": [...] }
]
```

The `normalizeUnits()` function in `types/index.ts` handles both transparently.

---

## 📁 Structure

```
├── app/
│   ├── page.tsx                    # Landing
│   ├── decks/                      # Public deck explorer + demo
│   ├── dashboard/                  # User dashboard (auth required)
│   ├── learning/[deckId]/          # Learning workspace
│   ├── profile/                    # User profile + change password
│   ├── admin/                      # Admin panel (ADMIN role only)
│   ├── (auth)/login|register       # Auth pages
│   └── api/                        # API routes
├── components/
│   ├── flashcard/FlashcardPlayer   # Core flip card + TTS + sidebars
│   ├── common/SiteHeader           # Nav
│   └── ui/                         # Button, Input, Dialog, etc.
├── services/supabase/
│   ├── client.ts                   # Browser client
│   ├── server.ts                   # Server component client
│   ├── middleware.ts               # Middleware-specific client ← KEY
│   └── admin.ts                    # Service-role client
├── middleware.ts                   # Route protection
├── types/index.ts                  # Types + normalizeUnits()
└── supabase/schema.sql             # Full DB schema + RLS
```

---

## 🔐 Security

- RLS on all tables
- `SUPABASE_SERVICE_ROLE_KEY` only used in API routes (never exposed to client)
- Session enforced server-side via middleware on every request
- Expired deck → max 10 cards (enforced in API, not just UI)

---

## 🚀 Deploy to Vercel

```bash
vercel
# Add env vars in Vercel Dashboard
```

---

© Huy Tutor — [www.huytutor.io.vn](https://www.huytutor.io.vn)
