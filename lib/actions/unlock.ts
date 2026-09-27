"use server";

import { cookies } from "next/headers";
import { unlockCookie } from "@/lib/shared";

type Fn = "shared_vault" | "shared_collection" | "shared_fit" | "shared_piece";

/**
 * Try a password on a share link. Right, and it is kept in an httpOnly
 * cookie for that link (see lib/shared.ts) so the page can render unlocked;
 * wrong, and nothing is kept.
 */
export async function unlockShare(fn: Fn, token: string, password: string): Promise<{ ok: boolean }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !token || !password.trim()) return { ok: false };
  const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_token: token, p_password: password.trim() }),
    cache: "no-store",
  });
  const json = res.ok ? await res.json() : null;
  if (!json || json.password_required) return { ok: false };
  cookies().set(unlockCookie(token), password.trim(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return { ok: true };
}
