# Web audit — 2026-09-26

The web app's signed-in half was last redesigned in April. Since then the native app and the database moved on — token-based sharing (September), fits, collection detail, piece privacy, new piece fields, column-limited `users` reads — and the web's owner pages were never brought along. The shared pages (what visitors see) are current; the owner side is not.

Method: every route read end to end; the live site probed signed out; signup, confirmation, login and share flows traced through the code and the Supabase calls. Signed-in pages could not be exercised live — see "Verification" at the end.

## P0 — broken today

1. **Signing in lands on a dead link.** `/vault` redirects to `/vault/<username>`, which since the Stage 1 rewrite is the *shared* vault page and needs a `?k=` token. Without one it renders "This link is no longer active." The owner vault UI (`components/vault/vault-client.tsx` and friends) still exists but nothing renders it. Every "vault" link in the menu, the upgrade page and the add-piece form goes to the same place.
2. **Opening your own share link dead-ends.** Shared pages redirect an owner to `/vault` (item 1).
3. **Email confirmation 404s.** The confirmation email links to `/auth/confirm` (the path Supabase's Next.js template uses), which does not exist — the app only has `/auth/callback`, a different flow. Neither signup (web or native) passes `emailRedirectTo`, so the link's destination depends entirely on the Supabase dashboard's Site URL and template. The account is created because Supabase confirms the address before redirecting; only the landing page is missing.
4. **Signup leaves you nowhere.** With confirmation on, the web signup immediately pushes to `/vault`; the visitor is not signed in yet, so it bounces to `/login` with no "check your email".
5. **A fit made on the web disappears.** It is saved `link_only` with no share token minted, then the form navigates to `/fit/<user>/<slug>` without `?k=` — a dead link. There is no web page that lists or shows your own fits.

## P1 — wrong or missing, not fatal

6. `/login?error=confirmation_failed` shows a plain form; the error is never displayed.
7. No owner **collection detail** on the web — the collections list rows don't link anywhere.
8. No owner **fit** views on the web (list or detail); middleware protects `/fit/<slug>` owner routes that don't exist.
9. No **sharing controls** on the web — link visibility, rotate, password — so a web-only user cannot share anything. The old public-URL copy button (`public-vault-header.tsx`) builds a tokenless URL that is dead.
10. **Web fits default to `link_only`**; the app defaults to private. A fit made on the web is half-shared: marked shareable, with no link.
11. **Password rules differ**: web requires 8 characters, native 6.
12. **Username**: web signup takes it up front; native signup does not (it asks later, on `(auth)/username`). Both work; they should agree.
13. The **landing page** (`/`) is a stock shadcn template, off the design system.

## P2 — drift

14. Owner pages (vault, piece, collections, profile, settings, add/edit) are the April design; the app has since moved to the chrome spec (DM Sans + Plex Mono, chips, tokens), made in / subcategory, piece privacy, the gallery.
15. Web piece edit has no category/subcategory pickers and no privacy toggle.

## Fix plan

- **Pass 1 (P0):** a real owner vault at `/vault` built on the orphaned owner components; owner redirects go there; `/auth/confirm` route (token_hash) alongside `/auth/callback`, `emailRedirectTo` on both signups, a "check your email" state and a "confirmed" landing page; web fits start private and land on an owner fit page.
- **Pass 2 (P1):** owner collection detail and fits on the web, sharing controls, login error display, matching password and username rules, landing page.
- **Pass 3 (P2):** bring owner pages to the chrome spec.

## Verification

Signed-in flows need a signed-in session to test end to end. Options: the owner tests each pass in a browser, or a dedicated test account (created by the owner) is used for automated checks. Supabase dashboard settings (Site URL, Redirect URLs, email template) can only be checked by the owner.

## Status

- **Pass 1 — shipped 2026-09-26** (main 132a41e): items 1–5.
- **Pass 2 — on `web-shakedown`**: owner collection page and linked list rows (7), owner fits list and page (8, with pass 1), sharing controls on vault, collections, fits and pieces (9), fits private by default (10, pass 1), login error (6, pass 1), matching 8-character passwords (11, native signup), landing page (13). Item 12 stays as it is by choice: the web asks for a username at signup, the app right after first sign-in — both end with the same account. Collection delete now asks first.
- **Pass 3 — pending**: design parity (14, 15).

