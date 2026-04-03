import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { EditPieceForm } from "@/components/vault/edit-piece-form";

interface EditPageProps {
  params: { id: string };
}

export default async function EditPiecePage({ params }: EditPageProps) {
  const user = await requireUser();
  const supabase = await createServerClient();

  const { data: piece } = await supabase
    .from("pieces")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!piece) notFound();

  const displayName = piece.name ?? piece.type;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Back navigation */}
      <div className="mb-8">
        <Link
          href={`/vault/${piece.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-gray-700"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to {displayName}
        </Link>
      </div>

      <div className="mb-8">
        <p className="font-mono-display text-xs uppercase tracking-widest text-gray-400">
          {piece.brand}
        </p>
        <h1 className="mt-1 text-2xl capitalize text-gray-900">
          Edit {displayName}
        </h1>
      </div>

      <EditPieceForm piece={piece} userId={user.id} />
    </div>
  );
}
