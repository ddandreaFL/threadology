import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { PieceHero } from "@/components/vault/piece-hero";
import { DeletePieceModal } from "@/components/vault/delete-piece-modal";
import { PieceCollectionButton } from "@/components/collections/piece-collection-button";
import { parseCropPositions } from "@/types";

interface Props {
  params: { username: string; id: string };
}

type PillVariant = "neutral" | "green" | "gold";

function MetaPill({ label, value, variant = "neutral" }: { label: string; value: string; variant?: PillVariant }) {
  const bg = { neutral: "bg-[#F5F5F5]", green: "bg-[#EDF6F1]", gold: "bg-[#FBF7EE]" }[variant];
  const color = { neutral: "text-[#555555]", green: "text-[#2D5A45]", gold: "text-[#8B6930]" }[variant];
  return (
    <div className={`flex flex-col rounded-[10px] px-[14px] py-[10px] ${bg}`}>
      <span className={`text-[9px] font-medium uppercase tracking-[0.08em] ${color} opacity-75`}>{label}</span>
      <span className={`mt-0.5 text-[13px] font-medium capitalize ${color}`}>{value}</span>
    </div>
  );
}

export default async function PublicPiecePage({ params }: Props) {
  const [supabase, viewer] = await Promise.all([createServerClient(), getUser()]);

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
      ? supabase.from("collections").select("id, name").eq("user_id", profile.id).order("position")
      : Promise.resolve({ data: [] }),
    isOwner
      ? supabase.from("collection_pieces").select("collection_id").eq("piece_id", params.id)
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

  const photos: string[] = piece.photos ?? [];
  const cropPositions = parseCropPositions(piece.crop_positions);
  const thumbPhoto = photos[0] ?? null;
  const thumbCrop = cropPositions?.["0"];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const estimatedValue = (piece as any).estimated_value as number | null;

  const pills: Array<{ label: string; value: string; variant: PillVariant }> = (
    [
      piece.condition ? { label: "COND", value: piece.condition, variant: "green" as PillVariant } : null,
      piece.year ? { label: "YEAR", value: piece.year, variant: "neutral" as PillVariant } : null,
      piece.season ? { label: "SEASON", value: piece.season, variant: "neutral" as PillVariant } : null,
      piece.size ? { label: "SIZE", value: piece.size, variant: "neutral" as PillVariant } : null,
      estimatedValue != null
        ? { label: "EST VALUE", value: `$${estimatedValue.toLocaleString()}`, variant: "gold" as PillVariant }
        : null,
    ] as const
  ).filter((p): p is NonNullable<typeof p> => p !== null);

  const storyParagraphs = piece.story
    ? piece.story.split("\n\n").map((s: string) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="pb-28">
      {/* Hero — breaks out of AppShell px-4 */}
      <div className="relative -mx-4">
        {/* Back nav overlay */}
        <Link
          href={`/vault/${params.username}`}
          className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 text-[12px] font-medium text-white backdrop-blur-sm transition-opacity hover:opacity-80"
        >
          <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          vault
        </Link>

        <PieceHero
          photos={photos}
          cropPositions={cropPositions}
          displayName={displayName}
          pieceId={piece.id}
          isOwner={isOwner}
        />
      </div>

      {/* Content card — overlaps hero */}
      <div className="-mt-[72px] rounded-t-[28px] bg-white px-5 pt-7 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        {/* Brand + name */}
        <p className="text-[11px] uppercase tracking-[0.08em] text-[#999999]">{piece.brand}</p>
        <h1 className="mt-1 text-[24px] font-semibold leading-[1.2] tracking-[-0.02em] text-[#111111]">
          {displayName}
        </h1>

        {/* Metadata pills */}
        {pills.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {pills.map((p) => (
              <MetaPill key={p.label} label={p.label} value={p.value} variant={p.variant} />
            ))}
          </div>
        )}

        {/* Collections */}
        {isOwner && (pieceCollections.length > 0 || userCollections.length > 0) && (
          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#999999]">Collections</p>
              <Link
                href="/collections"
                className="text-[11px] text-[#999999] transition-colors hover:text-[#111111]"
              >
                Manage
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {pieceCollections.map((c) => (
                <span
                  key={c.id}
                  className="rounded-[6px] border border-[#E0E0E0] px-[10px] py-[5px] text-[11px] text-[#999999]"
                >
                  {c.name}
                </span>
              ))}
              <PieceCollectionButton pieceId={piece.id} collections={userCollections} />
            </div>
          </div>
        )}

        {/* Story */}
        {storyParagraphs.length > 0 && (
          <div className="mt-8 border-l-2 border-[#2D5A45] pl-[14px]">
            <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.1em] text-[#999999]">Story</p>
            {storyParagraphs.map((para: string, i: number) => (
              <p
                key={i}
                className={`text-[14px] leading-[1.8] text-[#444444]${i > 0 ? " mt-3" : ""}`}
              >
                {para}
              </p>
            ))}
          </div>
        )}

        {/* Delete */}
        {isOwner && (
          <div className="mt-10">
            <DeletePieceModal
              pieceId={piece.id}
              pieceName={displayName}
              buttonClassName="text-[11px] text-[#999999] transition-colors hover:text-red-500"
              buttonLabel="delete piece"
            />
          </div>
        )}
      </div>

      {/* Floating edit bar — owner only */}
      {isOwner && (
        <div className="fixed bottom-5 left-1/2 flex h-[52px] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center justify-between rounded-[30px] bg-[#1A1A1A] px-4 shadow-[0_4px_20px_rgba(0,0,0,0.18)]">
          <div className="flex min-w-0 items-center gap-3">
            {thumbPhoto ? (
              <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-md">
                <Image
                  src={thumbPhoto}
                  alt={displayName}
                  fill
                  sizes="32px"
                  className="object-cover"
                  style={thumbCrop ? { objectPosition: `${thumbCrop.x}% ${thumbCrop.y}%` } : undefined}
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
