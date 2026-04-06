# Threadology — Changelog

---

## [2026-04-06] — Collection Stats, Free Tier Limits & Value Field

### Added

**Collection Stats**
- `components/vault/collection-stats.tsx` — client component computing and displaying collection stats from the pieces array. Primary row always visible (pieces · brands · era span). Expandable detail section (click "more ↓") reveals: top 3 brands by count, type breakdown, and estimated collection value (or "Add values to see estimate" if none set).
- Replaces `VaultStats` in `PublicVaultHeader` — stats are now interactive on the vault page.

**Free Tier Limits**
- `lib/subscription.ts` — `getUserSubscription(userId)` fetches `is_premium` + piece count in parallel; returns `{ isPremium, pieceCount, pieceLimit }`. `FREE_PIECE_LIMIT = 25`.
- `components/vault/piece-limit-banner.tsx` — usage banner showing "X of 25 pieces" with a forest green progress bar. Turns amber when within 5 of limit or at limit. Owner-only; always visible to free users on their vault.
- `components/vault/upgrade-prompt.tsx` — full replacement for the add form when the free limit is hit. Shows lock icon, current count, benefits list (unlimited pieces, valuation dashboard, AI tag ID, PDF export, priority support), and "Upgrade for $8/month" CTA.
- `app/(main)/upgrade/page.tsx` — upgrade page showing plan details and benefits. Button is disabled with "Coming soon — payment not yet active" (Stripe integration pending). Shows "You're on Premium" confirmation for premium users.

**Value Field**
- `supabase/migrations/add_estimated_value.sql` — adds `estimated_value integer` column to pieces table.
- `estimated_value` added to `types/database.ts` pieces Row/Insert/Update.
- "Est. Value ($)" input field added to both `AddPieceForm` and `EditPieceForm` (dollar-prefixed number input, optional).

### Changed
- `app/(main)/vault/add/page.tsx` — now fetches subscription status before rendering. If at limit: shows `UpgradePrompt`. If within 5 of limit: shows `PieceLimitBanner` above the form. Otherwise: normal form.
- `app/vault/[username]/page.tsx` — adds `estimated_value` to pieces select; shows `PieceLimitBanner` below the vault header for free-tier owners.
- `components/vault/public-vault-header.tsx` — replaced `VaultStats` with `CollectionStats`; updated piece type to include `type` and `estimated_value`.
- `lib/actions/pieces.ts` — `updatePiece` now includes `estimated_value` in the updatable fields.
- `middleware.ts` — added `/upgrade` to protected routes.

### SQL to run in Supabase
```sql
ALTER TABLE pieces ADD COLUMN IF NOT EXISTS estimated_value integer;
```

---

## [2026-04-05] — Public Vault Page

### Added
- `app/vault/[username]/page.tsx` — Public vault page accessible to anyone (no auth required). Displays the owner's piece grid, username, bio, and stats. Includes owner-only actions (Edit Profile, Copy Link, floating Add Piece button) and a visitor footer CTA ("Create your own vault →") for non-logged-in users.
- `app/vault/[username]/[id]/page.tsx` — Public piece detail page. Anyone can view; owner gets Edit/Delete controls. Replaces the old auth-only `/vault/[id]` route.
- `app/vault/[username]/[id]/edit/page.tsx` — Edit piece page, now at the username-scoped URL. Auth enforced inline via `requireUser()`.
- `app/vault/layout.tsx` — Public layout wrapping all `/vault/[username]` routes. Shows Threadology header with UserMenu (logged-in) or Login/Sign Up buttons (visitor).
- `components/vault/public-vault-header.tsx` — Vault header component: username (Cormorant Garamond, text-3xl), bio, stats row, and owner action buttons.
- `components/vault/vault-stats.tsx` — Stats component computing piece count, brand count, and era span (parses 4-digit years from year strings).
- `components/vault/copy-link-button.tsx` — Client component that copies the vault URL to clipboard with a "Copied!" confirmation flash.
- OpenGraph + Twitter card metadata generated per vault from `generateMetadata`.

### Changed
- **URL structure:** Piece detail and edit pages moved from `/vault/[id]` and `/vault/[id]/edit` to `/vault/[username]/[id]` and `/vault/[username]/[id]/edit` to support the public vault URL scheme.
- `app/(main)/vault/page.tsx` — Now redirects immediately to `/vault/[username]` (the public vault). Logged-in users land on their own public vault, where they see owner controls.
- `components/vault/piece-card.tsx` — Added optional `basePath` prop; piece link becomes `${basePath}/${piece.id}` when provided.
- `components/vault/vault-grid.tsx` — Added optional `basePath` prop, passed through to each `PieceCard`.
- `components/vault/edit-piece-form.tsx` — Added `backHref` prop replacing hardcoded `/vault/${piece.id}` cancel link.
- `lib/actions/pieces.ts` — `updatePiece` now fetches the user's username after saving and redirects to `/vault/${username}/${pieceId}`.
- `middleware.ts` — Narrowed vault protection from `startsWith("/vault")` to only `/vault` and `/vault/add`. Public vault routes (`/vault/[username]/**`) are now accessible without auth.

### Removed
- `app/(main)/vault/[id]/page.tsx` — Replaced by `app/vault/[username]/[id]/page.tsx`.
- `app/(main)/vault/[id]/edit/page.tsx` — Replaced by `app/vault/[username]/[id]/edit/page.tsx`.

---

## [2026-03-31] — Project Scaffold

### Added
- Next.js 14 project with App Router, TypeScript, Tailwind CSS, ESLint
- shadcn/ui initialized (v4.1.1, uses `@base-ui/react` under the hood)
- Route groups: `(auth)` for login/signup, `(main)` for vault and fit pages
- Placeholder pages: `/login`, `/signup`, `/vault`, `/fit/new`, `/fit/[slug]`
- `components/ui/button.tsx` from shadcn, `lib/utils.ts` cn() helper
- `types/index.ts` with initial User, GarmentItem, Fit interfaces
- Git initialized with initial commit

### Notes
- `next/font/google` does not export Geist/Geist_Mono in this environment — using local VF font files instead
- shadcn v4 button uses `@base-ui/react` not `@radix-ui/react-slot`, so `asChild` prop is not available; use `<Link>` directly for nav buttons

---

## [2026-03-31] — Supabase Integration & Database Schema

### Added
- `@supabase/supabase-js` and `@supabase/ssr` installed
- `lib/supabase.ts` — browser `createClient` for Client Components
- `lib/supabase-server.ts` — async `createServerClient` with SSR cookie handling for Server Components / Route Handlers / Server Actions
- `types/database.ts` — hand-written typed `Database` interface for all four tables
- `supabase/schema.sql` — full schema:
  - `fit_visibility` enum (`private`, `link_only`, `public`)
  - Tables: `users`, `pieces`, `fits`, `fit_pieces`
  - `updated_at` trigger on `pieces` and `fits`
  - `handle_new_user` trigger auto-creates `users` profile on `auth.users` insert
- Row Level Security on all tables: owners get full CRUD; public can read `link_only`/`public` fits and their associated pieces
- `.env.local.example` with env var template

### Fixed
- Split `lib/supabase.ts` into browser and server files — `next/headers` (server-only) was co-located with browser client, which would bundle server code into Client Components

### Notes
- Hand-written `Database` type must include `Relationships: []` on every table and `Views`/`Functions` on the schema — required by `GenericTable` / `GenericSchema` in `@supabase/postgrest-js`. Missing fields cause all `.update()` calls to resolve to `never`.

---

## [2026-03-31] — Authentication Forms

### Added
- `components/auth/auth-form.tsx` — shared `AuthForm` card wrapper, `FormField`, `SubmitButton` primitives
- `app/(auth)/login/page.tsx` — email/password login wired to `supabase.auth.signInWithPassword()`, inline error display, loading state, redirects to `/vault`
- `app/(auth)/signup/page.tsx` — username/email/password signup with:
  - Client-side validation (username regex `[a-zA-Z0-9_]{3,30}`, password min 8 chars)
  - Username availability pre-check against `public.users`
  - Username passed via `options.data` so `handle_new_user` trigger uses it directly
  - Ghost-user detection (Supabase returns empty `identities[]` for duplicate emails)
  - Fallback `users.update()` for when email confirmation is enabled

### Notes
- Supabase auth color palette: cream `#F5F1EA` background, `#FDFCFA` inputs, `#E0D8CC` borders, `#2D5A45`/`#1E3D2F` primary button

---

## [2026-03-31] — Route Protection & Main Layout

### Added
- `middleware.ts` — session refresh + route guards using `@supabase/ssr`:
  - Protected: `/vault*`, `/fit/new`, `/fit/*/edit`, `/fit/[slug]`
  - Auth-only (redirect to `/vault` if signed in): `/login`, `/signup`
  - Public: `/`, `/fit/*/*`
- `lib/auth.ts` — server helpers: `getUser()`, `requireUser()`, `getUserProfile()`
- `lib/actions/auth.ts` — `signOut()` server action (clears session cookie, redirects to `/login`)
- `components/layout/user-menu.tsx` — avatar/initial trigger button, click-outside dropdown with username header, vault/fit links, sign-out form action
- `app/(main)/layout.tsx` — sticky cream header with Threadology wordmark and `UserMenu`; calls `requireUser()` for dual auth protection; wraps children in `max-w-5xl` container

### Notes
- Middleware must always return the same `supabaseResponse` object that was built in `setAll` — returning a different `NextResponse` drops the refreshed session cookies
- Dual protection: middleware handles redirect for unauthenticated users; layout calls `requireUser()` as a belt-and-suspenders guard

---

## [2026-03-31] — Storage & Photo Upload

### Added
- `supabase/storage-setup.sql` — creates `images` bucket (5 MB limit, JPEG/PNG/WebP/GIF), four storage RLS policies keyed on `storage.foldername(name)[1] = auth.uid()`
- `lib/storage.ts` — `uploadImage(file, userId)`, `deleteImage(url)`, `getPublicUrl(path)` helpers; client-side file validation; path extraction from public URL for delete
- `components/vault/photo-upload.tsx` — multi-file upload with per-photo state (uploading spinner, error overlay, remove button, drag-to-reorder); uploads immediately on selection; `onUploadingChange` callback gates parent submit
- `components/vault/add-piece-form.tsx` — full add-piece client form: brand/type required, all other fields optional; submit disabled and shows "Uploading photos…" spinner while any upload in progress
- `app/(main)/vault/add/page.tsx` — server page passing `user.id` to the form
- `app/(main)/vault/page.tsx` — initial piece grid with empty state

### Notes
- `contentType: file.type` must be passed to the storage upload call or Supabase defaults to `application/octet-stream`, breaking image display
- `deleteImage(url)` parses the storage path by splitting on `/object/public/images/` — brittle if the project URL or bucket name changes

---

## [2026-03-31] — Tailwind + CSS Fix

### Fixed
- `globals.css` was generated with Tailwind v4 syntax (`@import "shadcn/tailwind.css"`, `@apply border-border outline-ring/50`) but project uses Tailwind v3
- Removed `@import "shadcn/tailwind.css"` (v4-only)
- Replaced `@apply border-border outline-ring/50` with direct CSS using `color-mix()` for the opacity
- Added full shadcn color mapping to `tailwind.config.ts` (`border`, `ring`, `muted`, `primary`, `secondary`, `accent`, `card`, `popover`, `destructive`, `input`) so all shadcn utility classes resolve

### Notes
- Tailwind v3 cannot apply opacity modifiers (`/50`) to colors defined as plain `var()` — opacity modifiers require `hsl(var(--x) / <alpha-value>)` channel format or direct `color-mix()` in CSS

---

## [2026-03-31] — Vault Display & Piece Detail

### Added
- IBM Plex Mono and Cormorant Garamond loaded via Google Fonts `<link>` in root layout; registered in Tailwind as `font-mono-display` and `font-serif`
- `components/vault/piece-card.tsx` — square photo thumbnail, brand in IBM Plex Mono (uppercase, tracking-widest), name/type in Cormorant Garamond serif, year; hover lift (`-translate-y-0.5`) + photo scale (`scale-[1.03]`); placeholder shirt SVG when no photos
- `components/vault/vault-grid.tsx` — responsive `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
- `components/vault/empty-vault.tsx` — Lucide `Shirt` icon, serif headline, green CTA to `/vault/add`
- `app/(main)/vault/page.tsx` — "Your Vault" serif title, stats row (piece count · unique brand count), renders `VaultGrid` or `EmptyVault`
- `app/(main)/vault/[id]/page.tsx` — piece detail: two-column layout with full photo gallery + metadata grid (empty fields omitted) + story; `notFound()` if piece doesn't belong to current user

### Changed
- Renamed `/vault/new` → `/vault/add` to match spec

### Notes
- `next/font/google` does not resolve named exports (IBM_Plex_Mono, Cormorant_Garamond) at runtime in this environment — Google Fonts loaded via `<link>` as a workaround
- Piece detail uses `.eq("user_id", user.id)` at the query level in addition to RLS for defence in depth

---

## [2026-04-02] — Piece Detail Page

### Added
- `components/vault/photo-gallery.tsx` — client component with selected-photo state; large primary image swaps on thumbnail click; thumbnail strip hidden when only one photo; active thumbnail gets forest green ring
- `components/vault/delete-piece-modal.tsx` — confirmation dialog with backdrop blur; shows piece name in confirmation copy; destructive red Delete button; loading/error states; redirects to `/vault` on success
- `lib/actions/pieces.ts` — added `deletePiece(pieceId)` server action; scoped to `user_id` for defence in depth on top of RLS

### Changed
- `app/(main)/vault/[id]/page.tsx` — full redesign of piece detail:
  - Back chevron link to vault
  - `PhotoGallery` client component replaces static images
  - Brand in IBM Plex Mono (uppercase, tracking-widest); name/type in Cormorant Garamond serif at `text-3xl`; year · season in gray below
  - Metadata 2-col grid (type, size, condition, year, season — empty fields omitted)
  - Story rendered as `<blockquote>` with `#2D5A45` left border, serif italic
  - Owner-only Edit link + Delete modal below details

### Notes
- `isOwner` guard derived from `piece.user_id === user.id` client-side (redundant with `.eq("user_id", user.id)` in the query, but explicit for future public-viewing mode)
- `deletePiece` does not delete associated Storage files — orphaned images remain in the bucket; clean-up can be added when edit flow is built

---

## [2026-04-02] — Automated CHANGELOG & Commit Hook

### Added
- `docs/CHANGELOG.md` with full project history from day one
- `.claude/settings.local.json` Stop hook: after every Claude response, injects a checklist reminder into Claude's context to (1) append to CHANGELOG.md and (2) run `git add . && git commit && git push`
- `Bash(git push:*)` added to the local settings allow list so push runs without a permission prompt

### Notes
- The Stop hook uses `hookSpecificOutput.additionalContext` — invisible in the UI, but injects the reminder into Claude's model context after every turn
- `settings.local.json` is gitignored (personal overrides); hook only applies to this machine

---

## [2026-04-03] — Create Fit Flow

### Added
- `lib/actions/fits.ts` — `createFit(data)` server action: inserts `fits` row + all `fit_pieces` rows, returns `{ username, slug }` for client-side redirect
- `components/fit/piece-slot.tsx` — slot component; empty state shows dashed border + add icon; filled state shows thumbnail (with `crop_positions` applied), brand in IBM Plex Mono, piece name, drag handle, and × remove button
- `components/fit/piece-selector.tsx` — bottom-sheet modal (full-screen on mobile, centered on sm+); live search by brand/type/name; 3-col thumbnail grid; already-selected pieces shown with green checkmark and disabled; "Add a new piece to your vault" footer link
- `components/fit/fit-form.tsx` — client component managing all form state: photos (up to 3 via `PhotoUpload`), piece slots (start 4, expandable), drag-to-reorder slots, title/caption/date/location fields, real-time preview URL, submit validation (≥1 photo + ≥1 piece), redirects to `/fit/[username]/[slug]` on success
- `app/(main)/fit/new/page.tsx` — server page: fetches user profile + vault pieces in parallel, renders `FitForm`

### Notes
- `generateSlug` in `FitForm`: slugifies title if provided, falls back to `fit-YYYY-MM-DD`; used for both the live preview URL and the submitted slug
- Slug uniqueness is enforced by the DB; a duplicate-slug error surfaces as a form error message
- Fit visibility defaults to `link_only` on creation
- `layer_order` = slot index of filled pieces after nulls are filtered out

---

## [2026-04-03] — Carousel Slide Animation & Edit Piece Page

### Added
- `app/(main)/vault/[id]/edit/page.tsx` — edit piece page; fetches piece server-side, guards with `requireUser()` + `.eq("user_id", user.id)`, renders `EditPieceForm`
- `components/vault/edit-piece-form.tsx` — pre-populated edit form; calls `updatePiece` server action on submit; Cancel link returns to piece detail
- `lib/actions/pieces.ts` — `updatePiece(pieceId, data)` server action; scoped to `user_id`; redirects to `/vault/[id]` on success

### Fixed
- Photo gallery white flash on navigation: replaced opacity-fade with CSS slide animation — outgoing image slides out while incoming slides in simultaneously (no background visible)
- Edit piece button 404: `/vault/[id]/edit` route now exists

### Changed
- `app/globals.css` — added `carousel-in-right`, `carousel-in-left`, `carousel-out-left`, `carousel-out-right` keyframes and corresponding `animate-carousel-*` utility classes
- `components/vault/photo-gallery.tsx` — carousel now tracks `prev`/`direction`/`transitioning` state; both outgoing and incoming images are absolutely positioned and animate simultaneously; `key` props ensure CSS animations restart on each transition

### Notes
- Carousel animation duration is 300ms ease-in-out; touch swipe threshold remains 50px
- Both images are rendered during the 300ms transition window, then the outgoing image is unmounted

---

## [2026-04-03] — Swipe Gallery & Image Repositioning

### Added
- `components/vault/image-adjuster.tsx` — drag-to-reposition modal: pointer-captured drag updates `object-position` in real time; calculates per-axis sensitivity from natural image dimensions so drag feels 1:1 regardless of portrait/landscape ratio; calls `updateCropPositions` server action on Save
- `supabase/migrations/add_crop_positions.sql` — `ALTER TABLE pieces ADD COLUMN crop_positions jsonb DEFAULT '{}'`

### Changed
- `components/vault/photo-gallery.tsx` — full rewrite:
  - Touch swipe (left→next, right→prev) with 50px threshold
  - Smooth opacity fade (120ms) between photos
  - Dot indicators overlaid at bottom of primary image; tappable to jump to photo
  - Desktop prev/next arrow buttons; hidden until hover (`group-hover:opacity-100`)
  - `cropPositions` prop applied via `object-position` on primary image and thumbnails
  - Owner-only "Reposition photo" button below the image; opens `ImageAdjuster` modal
  - Optimistic local update of `cropPositions` after a successful save
- `app/(main)/vault/[id]/page.tsx` — passes `cropPositions`, `pieceId`, `isOwner` to `PhotoGallery`
- `app/(main)/vault/page.tsx` — adds `crop_positions` to piece select query
- `components/vault/vault-grid.tsx` — adds `crop_positions` to Piece Pick type
- `components/vault/piece-card.tsx` — applies `object-position` on cover photo from `crop_positions["0"]`
- `types/database.ts` — adds `crop_positions: Record<string, { x: number; y: number }> | null` to pieces Row/Insert/Update
- `lib/actions/pieces.ts` — adds `updateCropPositions(pieceId, cropPositions)` server action

### Notes
- Run `supabase/migrations/add_crop_positions.sql` in the Supabase SQL editor before deploying
- Drag sensitivity is calculated from natural image dimensions on load; square images (no overflow) correctly show 0 sensitivity (nothing to reposition)
- `object-position` percentages stored as `{ x, y }` where 50/50 = center (CSS default)

---

## [2026-04-03] — Vercel Deployment & Security Audit

### Fixed
- Vercel build was deploying old commit (98d5382) due to manual redeploy of stale deployment — resolved by pushing a clean commit
- Git committer email (`ddandrea@threadology.dev`) not linked to GitHub account — updated `git config user.email` to `dill10dill@gmail.com`; force-pushed amended commit so Vercel could associate committer with GitHub user
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel had spaces and `.env.local` appended due to paste error — corrected to clean JWT value
- Updated `.env.local` to use JWT anon key (replacing old `sb_publishable_*` format key)

### Security Audit
- No hardcoded credentials in any source file
- `.env.local` properly gitignored; only `.env.local.example` committed
- Supabase anon key correctly uses `NEXT_PUBLIC_` prefix (safe for client exposure)
- No service role key used anywhere in the codebase
- RLS policies enforce ownership on all four tables and storage bucket
- Auth enforced at middleware level and via `requireUser()` in all server actions/pages

### Notes
- Omitting `Co-Authored-By` Claude trailer from all commits — Vercel free (Hobby) plan treats co-authors as team members and blocks deploys

---

## [2026-04-02] — Font & Build Fix

### Changed
- `app/layout.tsx` — replaced raw `<link>` Google Fonts tags with `next/font/google` imports (`DM_Sans`, `Cormorant_Garamond`, `IBM_Plex_Mono`); removed Geist Sans local font; CSS variables renamed to `--font-dm-sans`, `--font-cormorant`, `--font-ibm-plex-mono`
- `tailwind.config.ts` — updated `fontFamily` entries to use new CSS variables (`var(--font-dm-sans)`, `var(--font-cormorant)`, `var(--font-ibm-plex-mono)`)

### Fixed
- Removed unused `setEntryState` helper from `components/vault/photo-upload.tsx` that was causing an ESLint `no-unused-vars` build error
- `npm run build` now passes cleanly with zero errors or warnings

### Notes
- Vercel "custom fonts not added in _document.js" warning was caused by raw `<link>` tags in JSX; resolved by using `next/font/google`
- `next/font/google` correctly exports `Cormorant_Garamond`, `DM_Sans`, `IBM_Plex_Mono` in Next.js 14.2.35 (earlier `node -e require()` test was a false negative — ESM module not resolvable via CommonJS)

---

## [2026-04-02] — README

### Changed
- Replaced the default create-next-app README with a project overview covering what Threadology does, the tech stack, project structure, getting-started steps, and database/storage schema summary

---
