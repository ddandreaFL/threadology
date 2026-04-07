# Changelog

## [Unreleased]

### Security

- **Critical — Private fits exposure:** Removed `"fits are publicly readable"` RLS policy (`USING (true)`) added in `public_read_policies.sql` migration. This policy overrode the scoped `visibility IN ('link_only', 'public')` policy from `schema.sql` and made all fits — including private ones — readable by anyone via the REST API. The original policy is sufficient and has been re-verified. *(Requires SQL migration: `supabase/migrations/security_fixes.sql`)*

- **Critical — `is_premium` self-grant:** Revoked broad `UPDATE` privilege on `public.users` from the `authenticated` role and replaced it with column-level grants on `username`, `bio`, and `avatar_url` only. Previously, any signed-in user could call the REST API to set `is_premium = true` on their own row, bypassing the payment system entirely. *(Requires SQL migration: `supabase/migrations/security_fixes.sql`)*

- **High — Piece limit not enforced server-side:** The add-piece form was calling `supabase.from("pieces").insert()` directly from the browser client, bypassing the server entirely. Wired the form through the `addPiece` server action, which now checks `getUserSubscription()` before inserting. Free users at or above the 25-piece limit receive an error regardless of how the endpoint is called.

- **Medium — Missing security headers:** Added `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Strict-Transport-Security: max-age=31536000; includeSubDomains` to all responses via `next.config.mjs`.

- **Low — `.gitignore` gap:** Extended coverage from `.env*.local` to `.env` and `.env.*` to prevent accidental commit of plain `.env` files.

### Verification status

| Check | Status | Notes |
|---|---|---|
| Private fits not readable unauthenticated | Verified | REST API returns `[]` without auth; `42501` with auth on private visibility query |
| `is_premium` cannot be self-granted | Verified | PATCH with authenticated JWT returns `42501 permission denied for table users` |
| Piece limit enforced server-side | Verified (code) | Server action checked; form no longer reaches DB directly |
| Security headers present | Deployed | Live on main via Vercel |

---

## Previous releases

*(No prior changelog entries — this is the first CHANGELOG entry for the project.)*
