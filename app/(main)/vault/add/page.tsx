import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { AddPieceForm } from "@/components/vault/add-piece-form";

export default async function NewPiecePage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/vault"
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Vault
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-semibold text-gray-900">Add a piece</h1>
      </div>

      <div className="rounded-2xl border border-[#E0D8CC] bg-white px-6 py-8">
        <AddPieceForm userId={user.id} />
      </div>
    </div>
  );
}
