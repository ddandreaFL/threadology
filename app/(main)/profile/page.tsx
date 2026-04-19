import { requireUser, getUserProfile } from "@/lib/auth";
import { getUserSubscription } from "@/lib/subscription";
import { createServerClient } from "@/lib/supabase-server";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileStats } from "@/components/profile/profile-stats";
import { ProfileActions } from "@/components/profile/profile-actions";
import { PieceLimitBanner } from "@/components/vault/piece-limit-banner";

function getEraSpan(years: (string | null)[]): string | null {
  const parsed = years.flatMap((y) => {
    if (!y) return [];
    const m = y.match(/\b(19|20)\d{2}\b/);
    return m ? [parseInt(m[0])] : [];
  });
  if (parsed.length < 2) return null;
  const min = Math.min(...parsed);
  const max = Math.max(...parsed);
  return min === max ? null : `${min}–${max}`;
}

function getTopBrands(brands: string[], limit = 5): string[] {
  const counts = new Map<string, number>();
  for (const b of brands) {
    const key = b.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([brand]) => brand);
}

export default async function ProfilePage() {
  const user = await requireUser();
  const [profile, subscription] = await Promise.all([
    getUserProfile(user.id),
    getUserSubscription(user.id),
  ]);

  if (!profile) return null;

  const supabase = await createServerClient();
  const { data: pieces } = await supabase
    .from("pieces")
    .select("brand, year")
    .eq("user_id", user.id);

  const allBrands = (pieces ?? []).map((p) => p.brand);
  const allYears = (pieces ?? []).map((p) => p.year);

  const pieceCount = pieces?.length ?? 0;
  const brandCount = new Set(allBrands.map((b) => b.toLowerCase())).size;
  const eraSpan = getEraSpan(allYears);
  const topBrands = getTopBrands(allBrands);

  return (
    <div className="mx-auto max-w-sm px-4 py-8">
      <ProfileHeader
        username={profile.username}
        avatarUrl={profile.avatar_url}
        createdAt={profile.created_at}
        isPremium={subscription.isPremium}
      />

      <ProfileStats
        pieceCount={pieceCount}
        brandCount={brandCount}
        eraSpan={eraSpan}
        topBrands={topBrands}
      />

      <ProfileActions username={profile.username} />

      {!subscription.isPremium && (
        <PieceLimitBanner
          count={subscription.pieceCount}
          limit={subscription.pieceLimit}
        />
      )}
    </div>
  );
}
