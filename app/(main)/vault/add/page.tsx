import { requireUser } from "@/lib/auth";
import { getUserSubscription } from "@/lib/subscription";
import { AddPieceForm } from "@/components/vault/add-piece-form";
import { UpgradePrompt } from "@/components/vault/upgrade-prompt";

export default async function NewPiecePage() {
  const user = await requireUser();
  const { isPremium, pieceCount, pieceLimit } = await getUserSubscription(user.id);

  if (!isPremium && pieceCount >= pieceLimit) {
    return (
      <div className="mx-auto max-w-2xl">
        <UpgradePrompt currentCount={pieceCount} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <AddPieceForm userId={user.id} />
    </div>
  );
}
