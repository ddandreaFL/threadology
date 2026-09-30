import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase-server";

/**
 * A password-gated link, once opened, stays open for that browser: the
 * password rides in an httpOnly cookie named for the token, never in a URL,
 * and the page reads it here so the unlocked view renders on the server
 * like any other.
 */
/** A piece as a share link shows it: no owner-only fields. */
export type SharedPiece = {
  id: string;
  brand: string;
  type: string;
  name: string | null;
  year: string | null;
  season: string | null;
  size: string | null;
  condition: string | null;
  made_in: string | null;
  story: string | null;
  photos: string[];
  materials: string | null;
  acquired_where: string | null;
  acquired_at: string | null;
};

export const unlockCookie = (token: string) => `th_unlock_${token.replace(/[^A-Za-z0-9_-]/g, "")}`;

function rememberedPassword(token: string): string | undefined {
  try {
    return cookies().get(unlockCookie(token))?.value;
  } catch {
    // Outside a request (build time): nothing remembered.
    return undefined;
  }
}

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

/** The signed-in viewer's access token, or null (signed out, or outside a request). */
async function viewerSession(): Promise<string | null> {
  try {
    const supabase = await createServerClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

async function callShared(
  fn: "shared_vault" | "shared_collection" | "shared_fit" | "shared_piece",
  token: string | undefined,
  password?: string
): Promise<SharedResult> {
  // No token is not a share link at all.
  if (!token) return { kind: "unavailable" };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { kind: "unavailable" };
  password ??= rememberedPassword(token);

  // A signed-in viewer reads as themselves: shared_fit's viewer block, the
  // reactions' `mine` and the owner check all key on auth.uid(). Reading with
  // the anon key made every signed-in viewer look signed out, so the fit page
  // offered "sign in to react" to people who were.
  const session = await viewerSession();

  const read = (bearer: string) =>
    fetch(`${url}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${bearer}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_token: token, p_password: password ?? null }),
      cache: "no-store",
    });
  let res = await read(session ?? key);
  // A stale session is refused outright; the link itself is still good, so
  // read it as a visitor rather than showing a dead link.
  if (!res.ok && session) res = await read(key);
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
  // Who is looking, as the database sees them: enough for a client to send an
  // owner to their own screen and to know whether reacting is possible.
  viewer?: { signed_in: boolean; is_owner: boolean };
  reactions?: { emoji: string; count: number; mine: boolean }[];
  fit: {
    id: string;
    slug: string;
    title: string | null;
    caption: string | null;
    date: string | null;
    /** From detail_pages.sql on. */
    location?: string | null;
    photos: string[];
  };
  pieces: SharedFitPiece[];
};

export type SharedPieceData = {
  owner: SharedOwner;
  viewer?: { signed_in: boolean; is_owner: boolean };
  piece: {
    id: string;
    slug: string;
    brand: string;
    type: string;
    name: string | null;
    year: string | null;
    season: string | null;
    size: string | null;
    condition: string | null;
    made_in: string | null;
    story: string | null;
    photos: string[];
    materials: string | null;
    acquired_where: string | null;
    acquired_at: string | null;
    /** From detail_pages.sql on. */
    created_at?: string;
  };
  /** Fits this piece was worn in that are themselves shared by link. */
  worn_in?: { id: string; slug: string; title: string | null; date: string | null; photo: string | null; share_token: string }[];
  /** Collections it is in that are themselves shared by link. */
  collections?: { id: string; name: string; slug: string; share_token: string }[];
};

export type SharedPieceResult =
  | { kind: "ok"; data: SharedPieceData }
  | { kind: "password" }
  | { kind: "unavailable" };

/** One piece, shared on its own — the thing people actually send each other. */
export async function getSharedPiece(
  token?: string,
  password?: string
): Promise<SharedPieceResult> {
  const r = await callShared("shared_piece", token, password);
  if (r.kind !== "ok") return r;
  return { kind: "ok", data: r.data as unknown as SharedPieceData };
}

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
