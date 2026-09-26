import { requireUser } from "@/lib/auth";
import { AddPieceForm } from "@/components/vault/add-piece-form";

export default async function NewPiecePage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-2xl">
      <AddPieceForm userId={user.id} />
    </div>
  );
}
