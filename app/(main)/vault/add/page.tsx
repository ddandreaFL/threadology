import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getUserSubscription } from "@/lib/subscription";
import { AddPieceForm } from "@/components/vault/add-piece-form";
import { UpgradePrompt } from "@/components/vault/upgrade-prompt";
import { PieceLimitBanner } from "@/components/vault/piece-limit-banner";

export default async function NewPiecePage() {
  const user = await requireUser();
  const { isPremium, pieceCount, pieceLimit } = await getUserSubscription(user.id);

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
            <AddPieceForm userId={user.id} />
          </div>
        </>
      )}
    </div>
  );
}
