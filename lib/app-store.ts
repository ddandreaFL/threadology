/**
 * Where "get the app" goes. The app is not on the App Store yet; the web is
 * built as if it were (decision 2026-09-26), so this is one placeholder to
 * replace. Set NEXT_PUBLIC_APP_STORE_URL (and NEXT_PUBLIC_APP_STORE_ID for
 * Safari's Smart App Banner) when the listing exists.
 */
export const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL || "https://apps.apple.com/app/threadology";
export const APP_STORE_ID = process.env.NEXT_PUBLIC_APP_STORE_ID || null;
