/**
 * The profile's numbers — one call, get_profile_stats() (supabase/migrations/
 * profile_overhaul.sql), read the same way the app reads it
 * (threadology-native/lib/profileStats.ts) so both count alike.
 */

export type Count = { count: number };
export type BrandCount = { brand: string; count: number };
export type TypeCount = { type: string; count: number; subtypes: { subtype: string; count: number }[] };
export type EmojiCount = { emoji: string; count: number };
export type Saver = { username: string; avatar_url: string | null; count: number; latest_at: string };

export type LatestNotification = {
  kind: "addition" | "reaction" | "save";
  container_type: string;
  piece_count: number;
  emoji: string | null;
  actor_username: string | null;
  title: string | null;
};

export type ProfileStats = {
  user: { username: string; avatar_url: string | null; bio: string | null; created_at: string };
  totals: { pieces: number; fits: number; collections: number };
  brands: BrandCount[];
  types: TypeCount[];
  reactions: {
    total: number;
    fit_count: number;
    by_emoji: EmojiCount[];
    most_reacted_fit: {
      id: string;
      slug: string;
      title: string | null;
      photo: string | null;
      date: string | null;
      total: number;
      by_emoji: EmojiCount[];
    } | null;
  };
  saves: {
    total: number;
    vault: number;
    collections: number;
    fits: number;
    pieces: number;
    saver_count: number;
    latest_at: string | null;
    savers: Saver[];
    most_saved: { kind: "vault" | "collection" | "fit" | "piece"; id: string; count: number; title: string | null; photo: string | null } | null;
  };
  shelf_count: number;
  unread_count: number;
  latest_notification: LatestNotification | null;
  has_ever_shared: boolean;
};

/**
 * Which profile to draw. "new" has no pieces; "private" has pieces but has
 * never shared anything; "waiting" has shared but nobody has saved or
 * reacted yet. Otherwise the social sections show whichever has data.
 */
export type SocialState = "new" | "private" | "waiting" | "active";

export function socialState(s: ProfileStats): SocialState {
  if (s.totals.pieces === 0) return "new";
  if (s.reactions.total > 0 || s.saves.total > 0) return "active";
  return s.has_ever_shared ? "waiting" : "private";
}

export const SOCIAL_EMPTY: Record<Exclude<SocialState, "active">, { title: string; body: string; share: boolean }> = {
  new: {
    title: "Saves and reactions land here",
    body: "Once your vault has pieces, share the link. Anyone who saves or reacts shows up here.",
    share: false,
  },
  private: {
    title: "Nobody has seen your vault yet",
    body: "Saves and reactions come from shared links. Share your vault, a collection or a fit to start.",
    share: true,
  },
  waiting: {
    title: "Your link is out there",
    body: "Nobody has saved or reacted yet. When someone does, they show up here.",
    share: true,
  },
};

/** The inbox's activity row: what other people did, in a line. */
export function activitySummary(s: ProfileStats): string {
  const state = socialState(s);
  if (state === "new") return "saves and reactions land here";
  if (state === "private") return "share something to start";
  if (state === "waiting") return "nobody yet";
  const parts: string[] = [];
  if (s.reactions.total > 0) parts.push(`${s.reactions.total} ${s.reactions.total === 1 ? "reaction" : "reactions"}`);
  if (s.saves.total > 0) parts.push(`${s.saves.total} ${s.saves.total === 1 ? "save" : "saves"}`);
  return parts.join(" · ");
}

/** "@mira, @jkwon and 6 others" */
export function saverNames(savers: Saver[], total: number): string {
  const named = savers.slice(0, 2).map((s) => `@${s.username}`);
  const rest = total - named.length;
  if (rest <= 0) return named.join(" and ");
  return `${named.join(", ")} and ${rest} ${rest === 1 ? "other" : "others"}`;
}

/** The inbox row's sub-line — the same sentence the inbox shows. */
export function describeLatest(n: LatestNotification | null, unread: number): string {
  if (!n || unread === 0) return "all caught up";
  const who = n.actor_username ? `@${n.actor_username}` : "someone";
  const what = n.title ?? "something";
  if (n.kind === "addition") return `${n.piece_count} ${n.piece_count === 1 ? "piece" : "pieces"} added to ${what}`;
  if (n.kind === "reaction") return `${who} reacted ${n.emoji ?? ""} to ${what}`;
  return `${who} saved ${what}`;
}

/** Every brand the same count — a ranking would be noise. */
export function allEqual(rows: { count: number }[]): boolean {
  return rows.length > 1 && rows.every((r) => r.count === rows[0].count);
}

export function timeAgo(iso: string): string {
  const seconds = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function shortDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function emojiLine(rows: EmojiCount[], max = 2): string {
  return rows.slice(0, max).map((r) => `${r.emoji} ${r.count}`).join(" · ");
}

export const KIND_LABEL = { vault: "vault", collection: "collection", fit: "fit", piece: "piece" } as const;

/**
 * Reads the stats. Until profile_overhaul.sql is run the function does not
 * exist, so the page falls back to the profile and the three counts rather
 * than failing — the social sections read as not yet shared.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchProfileStats(supabase: any, userId: string): Promise<ProfileStats | null> {
  const { data, error } = await supabase.rpc("get_profile_stats");
  if (!error && data) return data as ProfileStats;

  const [{ data: user }, pieces, fits, collections] = await Promise.all([
    supabase.from("users").select("username, avatar_url, bio, created_at").eq("id", userId).single(),
    supabase.from("pieces").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("fits").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("collections").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);
  if (!user) return null;
  return {
    user,
    totals: { pieces: pieces.count ?? 0, fits: fits.count ?? 0, collections: collections.count ?? 0 },
    brands: [],
    types: [],
    reactions: { total: 0, fit_count: 0, by_emoji: [], most_reacted_fit: null },
    saves: { total: 0, vault: 0, collections: 0, fits: 0, pieces: 0, saver_count: 0, latest_at: null, savers: [], most_saved: null },
    shelf_count: 0,
    unread_count: 0,
    latest_notification: null,
    has_ever_shared: false,
  };
}
