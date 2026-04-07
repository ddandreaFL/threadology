import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getUserSubscription } from "@/lib/subscription";
import { createServerClient } from "@/lib/supabase-server";
import { AddPieceForm } from "@/components/vault/add-piece-form";
import { UpgradePrompt } from "@/components/vault/upgrade-prompt";
import { PieceLimitBanner } from "@/components/vault/piece-limit-banner";

async function getFrequentBrands(userId: string): Promise<string[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("pieces")
    .select("brand")
    .eq("user_id", userId);

  if (!data || data.length === 0) return [];

  const counts = new Map<string, number>();
  for (const p of data) {
    const b = p.brand.toLowerCase();
    counts.set(b, (counts.get(b) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([brand]) => brand);
}

export default async function NewPiecePage() {
  const user = await requireUser();
  const [{ isPremium, pieceCount, pieceLimit }, frequentBrands] =
    await Promise.all([
      getUserSubscription(user.id),
      getFrequentBrands(user.id),
    ]);

  const atLimit = !isPremium && pieceCount >= pieceLimit;
  const nearLimit = !isPremium && pieceCount >= pieceLimit - 5;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/vault"
          className="text-sm text-gray-500 transition-colors hover:text-gray-900"
        >
          ← Vault
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-lg font-semibold text-gray-900">Add a piece</h1>
      </div>

      {atLimit ? (
        <UpgradePrompt currentCount={pieceCount} />
      ) : (
        <>
          {nearLimit && (
            <div className="mb-4">
              <PieceLimitBanner count={pieceCount} limit={pieceLimit} />
            </div>
          )}
          <div className="rounded-2xl border border-[#E0D8CC] bg-white px-6 py-8">
            <AddPieceForm userId={user.id} frequentBrands={frequentBrands} />
          </div>
        </>
      )}
    </div>
  );
}
