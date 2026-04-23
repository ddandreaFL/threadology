import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { PhotoGallery } from "@/components/vault/photo-gallery";
import { DeletePieceModal } from "@/components/vault/delete-piece-modal";
import { PieceCollectionButton } from "@/components/collections/piece-collection-button";

interface Props {
  params: { username: string; id: string };
}

export default async function PublicPiecePage({ params }: Props) {
  const [supabase, viewer] = await Promise.all([createServerClient(), getUser()]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: profile } = await supabase
    .from("users")
    .select("id")
    .eq("username", params.username)
    .single();

  if (!profile) notFound();

  const isOwner = viewer?.id === profile.id;

  const [pieceResult, collectionsResult, membershipResult] = await Promise.all([
    supabase.from("pieces").select("*").eq("id", params.id).eq("user_id", profile.id).single(),
    isOwner
      ? db.from("collections").select("id, name").eq("user_id", profile.id).order("position")
      : Promise.resolve({ data: [] }),
    isOwner
      ? db.from("collection_pieces").select("collection_id").eq("piece_id", params.id)
      : Promise.resolve({ data: [] }),
  ]);

  const piece = pieceResult.data;
  if (!piece) notFound();

  const userCollections: { id: string; name: string }[] = collectionsResult.data ?? [];
  const pieceCollectionIds = new Set(
    (membershipResult.data ?? []).map((m: { collection_id: string }) => m.collection_id)
  );
  const pieceCollections = userCollections.filter((c) => pieceCollectionIds.has(c.id));
  const displayName = piece.name ?? piece.type;

  const metaFields = [
    { label: "type", value: piece.type },
    { label: "size", value: piece.size },
    { label: "condition", value: piece.condition },
  ].filter((f) => f.value);

  const thumbPhoto = piece.photos?.[0] ?? null;
  const cropPos = piece.crop_positions?.["0"];

  return (
    <div className="mx-auto max-w-4xl pb-28">
      {/* Back navigation */}
      <div className="mb-6">
        <Link
          href={`/vault/${params.username}`}
          className="inline-flex items-center gap-1.5 text-[13px] text-[#999999] transition-colors hover:text-[#111111]"
        >
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          vault
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
        <div>
          <p className="text-[11px] text-[#999999]">{piece.brand}</p>
          <h1 className="mt-1 text-[22px] font-medium leading-[1.2] tracking-[-0.02em] text-[#111111]">
            {displayName}
          </h1>
          {(piece.year || piece.season) && (
            <p className="mt-1.5 text-[12px] text-[#999999]">
              {[piece.year, piece.season].filter(Boolean).join(" · ")}
            </p>
          )}

          {/* Metadata rows */}
          {metaFields.length > 0 && (
            <div className="mt-5 border-t border-[#EBEBEB] pt-4">
              {metaFields.map((f) => (
                <div key={f.label} className="flex justify-between border-b border-[#F0F0F0] py-[9px]">
                  <span className="text-[12px] text-[#999999]">{f.label}</span>
                  <span className="text-[12px] capitalize text-[#111111]">{f.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Story */}
          {piece.story && (
            <div className="mt-5 border-t border-[#EBEBEB] pt-5">
              <p className="mb-[10px] text-[11px] text-[#999999]">story</p>
              <blockquote className="border-l-2 border-[#2D5A45] pl-[14px] text-[14px] leading-[1.8] text-[#444444]">
                {piece.story}
              </blockquote>
            </div>
          )}

          {/* Collection chips */}
          {isOwner && (pieceCollections.length > 0 || userCollections.length > 0) && (
            <div className="mt-[18px] flex flex-wrap gap-2">
              {pieceCollections.map((c) => (
                <span
                  key={c.id}
                  className="rounded-[4px] border border-[#E0E0E0] px-[10px] py-[5px] text-[11px] text-[#999999]"
                >
                  {c.name}
                </span>
              ))}
              <PieceCollectionButton pieceId={piece.id} collections={userCollections} />
            </div>
          )}

          {/* Delete link */}
          {isOwner && (
            <div className="mt-8">
              <DeletePieceModal
                pieceId={piece.id}
                pieceName={displayName}
                buttonClassName="text-[11px] text-[#999999] transition-colors hover:text-red-500"
                buttonLabel="delete piece"
              />
            </div>
          )}
        </div>
      </div>

      {/* Floating action bar — owner only */}
      {isOwner && (
        <div className="fixed bottom-5 left-1/2 flex h-[52px] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center justify-between rounded-[30px] bg-[#1A1A1A] px-4 shadow-[0_4px_16px_rgba(45,90,69,0.30)]">
          <div className="flex min-w-0 items-center gap-3">
            {thumbPhoto ? (
              <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-md">
                <Image
                  src={thumbPhoto}
                  alt={displayName}
                  fill
                  sizes="32px"
                  className="object-cover"
                  style={cropPos ? { objectPosition: `${cropPos.x}% ${cropPos.y}%` } : undefined}
                />
              </div>
            ) : (
              <div className="h-8 w-8 flex-shrink-0 rounded-md bg-white/10" />
            )}
            <span className="truncate text-[12px] font-medium text-white">{displayName}</span>
          </div>
          <Link
            href={`/vault/${params.username}/${piece.id}/edit`}
            className="flex-shrink-0 text-[12px] font-medium text-white/70 transition-colors hover:text-white"
          >
            edit
          </Link>
        </div>
      )}
    </div>
  );
}
