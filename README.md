# Threadology

A personal wardrobe vault for people who care about clothes. Log your pieces, document your fits, and build a visual archive of your wardrobe over time.

## What it does

- **Vault** — catalog every piece in your wardrobe with brand, type, size, condition, year, and photos
- **Fits** — compose outfits from your vault pieces and log them with photos, caption, date, and location
- **Sharing** — fits can be kept private, shared via link, or made fully public

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Fonts | Geist Sans / Mono (local), IBM Plex Mono, Cormorant Garamond |

## Project structure

```
app/
  (auth)/         # login, signup
  (main)/         # vault, fit builder — requires auth
    vault/        # piece grid, piece detail, add piece
    fit/          # fit pages
components/
  auth/           # auth form primitives
  vault/          # piece card, grid, upload, empty state
  fit/            # fit components
  layout/         # header, user menu
lib/
  supabase.ts         # browser client
  supabase-server.ts  # server client (SSR cookie handling)
  auth.ts             # getUser(), requireUser(), getUserProfile()
  storage.ts          # uploadImage(), deleteImage(), getPublicUrl()
  actions/            # server actions (auth, pieces)
types/
  database.ts     # typed Database interface (all tables)
supabase/
  schema.sql          # tables, triggers, RLS policies
  storage-setup.sql   # storage bucket + policies
middleware.ts     # session refresh + route protection
```

## Getting started

**1. Clone and install**
```bash
git clone https://github.com/ddandreaFL/threadology.git
cd threadology
npm install
```

**2. Set up Supabase**

Create a project at [supabase.com](https://supabase.com), then run the SQL files in order:
```
supabase/schema.sql
supabase/storage-setup.sql
```

**3. Configure environment**
```bash
cp .env.local.example .env.local
```
Fill in your Supabase project URL and anon key.

**4. Run**
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

## Database schema

Four tables: `users` (extends `auth.users`), `pieces`, `fits`, `fit_pieces` (junction).

Row Level Security is enabled on all tables. Owners have full CRUD on their own data. Fits marked `link_only` or `public` are readable by anyone, along with their associated pieces.

Storage uses a single `images` bucket. Files are namespaced by user ID (`{user_id}/{timestamp}-{filename}`) and access is enforced via storage RLS policies.
