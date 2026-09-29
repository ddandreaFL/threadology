import { notFound } from "next/navigation";
import { OwnerProfile } from "@/components/owner/OwnerProfile";
import type { ProfileStats } from "@/lib/profile-stats";

/**
 * The profile with stand-in data — for reviewing the overhaul without
 * signing in. Preview and local builds only.
 * ?v=full | private | waiting | new | flat | dominant | long
 */
export const metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const share = { visibility: "private" as const, token: null, hasPassword: false, slug: null };
const ago = (h: number) => new Date(Date.now() - h * 3600e3).toISOString();

const full: ProfileStats = {
  user: { username: "dillon", avatar_url: "/dev/sugarhill.jpg", bio: "timberland collector and threadology founder", created_at: "2026-03-01T00:00:00Z" },
  totals: { pieces: 47, fits: 12, collections: 5 },
  brands: [
    { brand: "Arc'teryx", count: 9 }, { brand: "Carhartt WIP", count: 7 }, { brand: "Levi's", count: 6 },
    { brand: "Stüssy", count: 4 }, { brand: "Patagonia", count: 3 },
    ...Array.from({ length: 11 }, (_, i) => ({ brand: `Brand ${i + 1}`, count: 1 })),
  ],
  types: [
    { type: "Tops", count: 18, subtypes: [{ subtype: "T-Shirt", count: 9 }, { subtype: "Shirt", count: 5 }, { subtype: "Knitwear", count: 4 }] },
    { type: "Outerwear", count: 11, subtypes: [{ subtype: "Jacket", count: 8 }, { subtype: "Vest", count: 3 }] },
    { type: "Bottoms", count: 9, subtypes: [] },
    { type: "Footwear", count: 5, subtypes: [{ subtype: "Boots", count: 5 }] },
    { type: "Accessories", count: 4, subtypes: [] },
  ],
  reactions: {
    total: 38, fit_count: 9,
    by_emoji: [{ emoji: "🔥", count: 17 }, { emoji: "😍", count: 9 }, { emoji: "👏", count: 7 }, { emoji: "🤝", count: 5 }],
    most_reacted_fit: { id: "f", slug: "f", title: "Live from Sugarhill", photo: "/dev/sugarhill.jpg", date: "2026-09-26", total: 17, by_emoji: [{ emoji: "🔥", count: 14 }, { emoji: "😍", count: 3 }] },
  },
  saves: {
    total: 23, vault: 9, collections: 6, fits: 5, pieces: 3, saver_count: 8, latest_at: ago(2),
    savers: ["mira", "jkwon", "tess", "ob", "lu", "kai", "rae", "sol"].map((u, i) => ({ username: u, avatar_url: null, count: 3 - (i % 3), latest_at: ago(2 + i * 5) })),
    most_saved: { kind: "piece", id: "p", count: 4, title: "Two-Tone Arc'teryx Weather Shell", photo: "/dev/jacket.jpg" },
  },
  shelf_count: 14,
  unread_count: 3,
  latest_notification: { kind: "save", container_type: "collection", piece_count: 1, emoji: null, actor_username: "mira", title: "gorpcore" },
  has_ever_shared: true,
};

const noSocial = {
  reactions: { total: 0, fit_count: 0, by_emoji: [], most_reacted_fit: null },
  saves: { total: 0, vault: 0, collections: 0, fits: 0, pieces: 0, saver_count: 0, latest_at: null, savers: [], most_saved: null },
  unread_count: 0,
  latest_notification: null,
};

const VARIANTS: Record<string, ProfileStats> = {
  full,
  private: { ...full, ...noSocial, has_ever_shared: false },
  waiting: { ...full, ...noSocial, has_ever_shared: true },
  new: { ...full, ...noSocial, user: { ...full.user, avatar_url: null, bio: null }, totals: { pieces: 0, fits: 0, collections: 0 }, brands: [], types: [], has_ever_shared: false },
  flat: { ...full, brands: ["Carhartt WIP", "Acne Studios", "Beams Plus", "Arc'teryx", "Barbour", ...Array.from({ length: 19 }, (_, i) => `Zeta ${i}`)].map((b) => ({ brand: b, count: 1 })) },
  dominant: { ...full, brands: [{ brand: "Timberland", count: 31 }, { brand: "Carhartt WIP", count: 3 }, { brand: "Levi's", count: 2 }, { brand: "Stüssy", count: 1 }, { brand: "Patagonia", count: 1 }] },
  long: { ...full, brands: [{ brand: "Comme des Garçons Homme Plus Evergreen", count: 6 }, { brand: "Engineered Garments", count: 5 }, { brand: "Mountain Research", count: 3 }] },
  reactionsOnly: { ...full, saves: noSocial.saves },
};

export default function DevProfile({ searchParams }: { searchParams: { v?: string; w?: string } }) {
  if (process.env.VERCEL_ENV === "production") notFound();
  const stats = VARIANTS[searchParams.v ?? "full"] ?? full;
  const page = <OwnerProfile userId="dev" stats={stats} share={share} />;
  // ?w=390 pins a phone width, for screenshots from tools that cannot go that narrow.
  return searchParams.w ? <div style={{ width: Number(searchParams.w) }}>{page}</div> : page;
}
