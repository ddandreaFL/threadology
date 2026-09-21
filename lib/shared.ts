import type { SharedPiece } from "@/components/shared/shared-pieces";

/**
 * Reading a shared container.
 *
 * One place decides what a viewer can see, because the rule — not a shared
 * component — is what keeps the app and the web from drifting. These
 * functions are the only public read path: they take the token from the URL
 * and go through shared_vault / shared_collection / shared_fit, which filter
 * private pieces and never touch the owner-only table.
 */

export type SharedOwner = {
  username: string;
  avatar_url: string | null;
  bio: string | null;
};

export type SharedCollectionSummary = {
  id: string;
  name: string;
  slug: string;
  share_token: string;
  piece_count: number;
  previews: string[];
};

export type SharedFitSummary = {
  id: string;
  slug: string;
  title: string | null;
  date: string | null;
  photos: string[];
  share_token: string;
};

export type SharedContainer = {
  owner: SharedOwner;
  collection?: { id: string; name: string; slug: string };
  pieces: SharedPiece[];
  // Present on a shared vault only: the containers the owner has already
  // chosen to share, each with the token a visitor needs to open it.
  collections?: SharedCollectionSummary[];
  fits?: SharedFitSummary[];
};

export type SharedResult =
  | { kind: "ok"; data: SharedContainer }
  | { kind: "password" }
  | { kind: "unavailable" };

async function callShared(
  fn: "shared_vault" | "shared_collection" | "shared_fit",
  token: string | undefined,
  password?: string
): Promise<SharedResult> {
  // No token is not a share link at all.
  if (!token) return { kind: "unavailable" };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { kind: "unavailable" };

  const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_token: token, p_password: password ?? null }),
    cache: "no-store",
  });
  if (!res.ok) return { kind: "unavailable" };

  const data = await res.json();
  if (!data) return { kind: "unavailable" };
  if (data.password_required) return { kind: "password" };
  return { kind: "ok", data: data as SharedContainer };
}

export function getSharedVault(token?: string, password?: string) {
  return callShared("shared_vault", token, password);
}

export function getSharedCollection(token?: string, password?: string) {
  return callShared("shared_collection", token, password);
}

export type SharedFitPiece = {
  id: string;
  brand: string;
  type: string;
  name: string | null;
  year: string | null;
  size: string | null;
  photos: string[];
  layer_order: number;
};

export type SharedFitData = {
  owner: SharedOwner;
  fit: {
    id: string;
    slug: string;
    title: string | null;
    caption: string | null;
    date: string | null;
    photos: string[];
  };
  pieces: SharedFitPiece[];
};

export type SharedFitResult =
  | { kind: "ok"; data: SharedFitData }
  | { kind: "password" }
  | { kind: "unavailable" };

export async function getSharedFit(
  token?: string,
  password?: string
): Promise<SharedFitResult> {
  const r = await callShared("shared_fit", token, password);
  if (r.kind !== "ok") return r;
  return { kind: "ok", data: r.data as unknown as SharedFitData };
}
