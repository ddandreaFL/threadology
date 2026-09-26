# Web rebuild — plan

Status: **proposed, 2026-09-26.** Supersedes pass 3 of `web-audit.md`.

## Why

The web was built first and the app became the product. Decisions made in the app since April — token sharing, fits, collection detail, piece privacy, the chrome spec, gallery mode, and now no paywall — never reached the web, so it reads as a different, older product. Two groups meet the web: **owners**, who should find the same product they use on their phone, and **visitors** — often without an account, following a friend's link — who should see what the app shows, and be led toward the app.

## Decisions (2026-09-26)

1. **No paywall, anywhere.** The 25-piece and collection limits, premium, the upgrade page and Stripe are removed from the web and the app, and the database trigger that enforces the piece limit is dropped. `is_premium` and `stripe_customer_id` stay in the table, dormant, so nothing needs migrating back if the model changes.
2. **Owners get full parity.** Every app screen has a web counterpart that behaves the same.
3. **Visitors see the app's screens**, consistently — and are led to download the app.
4. **A fresh web UI**, built from the app's design system; the old web components are retired.

## Principles

- **One design system.** Web tokens are a direct port of the app's `lib/theme.ts`: colors, radius family, type scale, DM Sans + IBM Plex Mono (via `next/font`), and the icon set. Nothing is restyled by eye.
- **Screens, not pages.** Each web screen is the app screen: same header (title, subtitle, at most two chips), same pill tab bar, same sheets, same empty states and wording.
- **Mobile-first; desktop is the phone column.** On a wide screen the app sits in a centered column (with grids allowed wider), so it stays one product rather than becoming a second desktop design.
- **Same data paths.** The web calls the same tables, RPCs and share URL shapes as the app. No web-only schema.
- **Share URLs never change.** `/vault/<u>?k=`, `/vault/<u>/c/<slug>?k=`, `/fit/<u>/<slug>?k=`, `/p/<u>/<slug>?k=` are in messages people have already sent.

## Structure

- `components/ui/` — the web chrome: `ScreenHeader`, `ChipButton`, `Icon` (ported glyphs), `TabBar` (the pill), `Sheet`, `Chip`/`ChipRow`, `Toast`.
- `components/coverflow/`, `components/gallery/` — the web cover flow (CSS 3D on a snapping scroller) and gallery mode.
- Owner routes, mirroring the app's tabs: `/vault` · `/fits` · `/collections` · `/profile`, plus `/pieces/[id]`, `/pieces/[id]/edit`, `/pieces/new`, `/collections/[id]`, `/fits/[id]`, `/fits/new`, `/saved`, `/notifications`, `/settings`, `/search`. Old owner URLs (`/vault/<u>/<id>`, `/vault/add`, `/fit/new`) redirect.
- Visitor routes keep their URLs and are rebuilt on the same components, plus a **get-the-app** layer: a persistent, dismissible prompt, an iOS Smart App Banner once the app is on the App Store, and CTAs at the natural moments (after saving, at the end of a collection, in the gallery).

## Phases

Each phase ships to a Vercel preview for review before it merges.

0. **Paywall removal** — web, app and database (drop `enforce_piece_limit`, remove limit checks, upgrade/billing UI, Stripe routes). Small; can ship on its own.
1. **Foundation** — tokens, fonts, icons, chrome, tab bar, sheets, cover flow, grid, gallery. Built against a hidden kitchen-sink page so every part can be checked side by side with the app.
2. **Visitor experience** — shared vault, collection, fit and piece rebuilt on the foundation; gallery mode for visitors; the get-the-app layer; password and dead-link states.
3. **Owner core** — the four tabs and piece detail.
4. **Owner create & edit** — the add-piece flow, edit piece (made in, category/subcategory, privacy), log/edit fit, new collection, collection edit mode.
5. **Account** — auth screens (welcome, login, signup, username) as in the app, saved, notifications, settings.
6. **Retire and verify** — delete the old components, add redirects, and walk every flow signed out, as a visitor, and as an owner.

## Open questions

1. **App download link.** The app is on TestFlight, not the App Store. Until it is, should visitors be pointed to a public TestFlight link, a waitlist, or only to the web?
2. **Sign in with Apple on the web.** The app offers it; the web has only email. Parity means adding it (a Supabase + Apple Services ID setup).
3. **Desktop.** The plan keeps the phone column on desktop. A distinct desktop layout would be a separate design.
