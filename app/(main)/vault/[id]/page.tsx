import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { PhotoGallery } from "@/components/vault/photo-gallery";
import { DeletePieceModal } from "@/components/vault/delete-piece-modal";

interface PiecePageProps {
  params: { id: string };
}

export default async function PiecePage({ params }: PiecePageProps) {
  const user = await requireUser();
  const supabase = await createServerClient();

  const { data: piece } = await supabase
    .from("pieces")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!piece) notFound();

  const isOwner = piece.user_id === user.id;
  const displayName = piece.name ?? piece.type;
  const metaFields = [
    { label: "Type", value: piece.type },
    { label: "Size", value: piece.size },
    { label: "Condition", value: piece.condition },
    { label: "Year", value: piece.year },
    { label: "Season", value: piece.season },
  ].filter((f) => f.value);

  return (
    <div className="mx-auto max-w-4xl">
      {/* Back navigation */}
      <div className="mb-8">
        <Link
          href="/vault"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-gray-700"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Vault
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        {/* Photo gallery */}
        <PhotoGallery
          photos={piece.photos}
          alt={displayName}
          cropPositions={piece.crop_positions}
          pieceId={piece.id}
          isOwner={isOwner}
        />

        {/* Details */}
        <div className="flex flex-col">
          {/* Brand + name */}
          <div>
            <p className="font-mono-display text-xs uppercase tracking-widest text-gray-400">
              {piece.brand}
            </p>
            <h1 className="mt-1 text-2xl capitalize leading-tight text-gray-900">
              {displayName}
            </h1>
            {(piece.year || piece.season) && (
              <p className="mt-1.5 text-sm text-gray-400">
                {[piece.year, piece.season].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>

          {/* Metadata grid */}
          {metaFields.length > 0 && (
            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-[#E0D8CC] pt-8">
              {metaFields.map((f) => (
                <div key={f.label}>
                  <dt className="font-mono-display text-[10px] uppercase tracking-widest text-gray-400">
                    {f.label}
                  </dt>
                  <dd className="mt-1 text-sm capitalize text-gray-700">{f.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {/* Story */}
          {piece.story && (
            <div className="mt-8 border-t border-[#E0D8CC] pt-8">
              <p className="font-mono-display text-[10px] uppercase tracking-widest text-gray-400">
                Story
              </p>
              <blockquote className="mt-3 border-l-2 border-[#2D5A45] pl-4 text-base italic leading-relaxed text-gray-600">
                {piece.story}
              </blockquote>
            </div>
          )}

          {/* Owner actions */}
          {isOwner && (
            <div className="mt-auto border-t border-[#E0D8CC] pt-8 mt-8 flex items-center gap-3">
              <Link
                href={`/vault/${piece.id}/edit`}
                className="rounded-lg border border-[#E0D8CC] bg-[#FDFCFA] px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-[#F5F1EA]"
              >
                Edit
              </Link>
              <DeletePieceModal
                pieceId={piece.id}
                pieceName={displayName}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
