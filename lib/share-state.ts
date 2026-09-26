import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Sharing state for something the signed-in person owns, read the same way
 * the app reads it (threadology-native/lib/sharing.ts), so a link set up on
 * one is the same link on the other.
 */

export type ShareType = "vault" | "collection" | "fit" | "piece";
export type ShareState = {
  visibility: "private" | "link_only";
  token: string | null;
  hasPassword: boolean;
  slug: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getShareState(supabase: SupabaseClient<any>, type: ShareType, id: string): Promise<ShareState> {
  if (type === "vault") {
    // Vault settings sit in users columns the public grant leaves out; the
    // owner reads them through my_vault_share().
    const { data } = await supabase.rpc("my_vault_share");
    const d = (data ?? {}) as { visibility?: string; token?: string | null; has_password?: boolean };
    return { visibility: d.visibility === "link_only" ? "link_only" : "private", token: d.token ?? null, hasPassword: !!d.has_password, slug: null };
  }
  const table = type === "collection" ? "collections" : type === "fit" ? "fits" : "pieces";
  const { data } = await supabase
    .from(table)
    .select(type === "collection" ? "visibility, share_token, password_hash, slug" : "visibility, share_token, password_hash, slug")
    .eq("id", id)
    .single();
  const d = (data ?? {}) as { visibility?: string; share_token?: string | null; password_hash?: string | null; slug?: string | null };
  return {
    // Fits and pieces have enums with more members; anything that is not
    // link sharing reads as private, as in the app.
    visibility: d.visibility === "link_only" ? "link_only" : "private",
    token: d.share_token ?? null,
    hasPassword: !!d.password_hash,
    slug: d.slug ?? null,
  };
}

export const WEB_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") ? process.env.NEXT_PUBLIC_APP_URL : "https://threadology.vercel.app";

/** The share URL — the same shapes the app builds. */
export function shareUrl(type: ShareType, username: string, token: string, slug: string | null): string {
  const path =
    type === "vault"
      ? `/vault/${username}`
      : type === "piece"
        ? `/p/${username}/${slug ?? ""}`
        : type === "fit"
          ? `/fit/${username}/${slug ?? ""}`
          : `/vault/${username}/c/${slug ?? ""}`;
  return `${WEB_ORIGIN}${path}?k=${token}`;
}
