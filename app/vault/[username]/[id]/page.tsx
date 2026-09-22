import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { PieceHero } from "@/components/vault/piece-hero";
import { DeletePieceModal } from "@/components/vault/delete-piece-modal";
import { PieceCollectionButton } from "@/components/collections/piece-collection-button";
import { parseCropPositions } from "@/types";
import { OwnerPageShell } from "@/components/layout/owner-page-shell";

interface Props {
  params: { username: string; id: string };
}

type PillVariant = "neutral" | "green" | "gold";

function MetaPill({ label, value, variant = "neutral" }: { label: string; value: string; variant?: PillVariant }) {
  // The fit page has one voice for a fact. A green pill next to a gold one
  // read as a ranking of the facts, which is not something the archive says.
  const isValue = variant === "gold";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 ${
        isValue ? "border-[#E4D9B8] bg-[#FDFAF0]" : "border-[#E8E5DE] bg-[#FAFAFA]"
      }`}
    >
      <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#BBBBBB]">{label}</span>
      <span className="text-[12px] font-semibold capitalize text-[#1B1A17]">{value}</span>
    </span>
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
    <OwnerPageShell>
      <div className="pb-28">
      {/* Hero — breaks out of AppShell px-4 */}
      <div className="relative -mx-4">
        {/* Back nav overlay */}
        <Link
          href={isOwner ? "/vault" : `/vault/${params.username}`}
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

      {/* Below the photo, the fit page's rhythm: attribution line, title,
          the piece's own line, then labelled sections separated by space
          rather than by a card edge. Nothing the zoned version showed has
          been dropped — condition, year, season, size, estimated value,
          collections and story are all still here. */}
      <div className="px-5 pt-7">
        <p className="font-mono text-[11px] uppercase tracking-[0.11em] text-[#2D5A45]">
          {piece.brand}
        </p>
        <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-[-0.02em] text-[#1B1A17]">
          {displayName}
        </h1>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.11em] text-[#6B6358]">
          {piece.type}
        </p>

        {pills.length > 0 && (
          <div className="mt-7">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6B6358]">
              details
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {pills.map((p) => (
                <MetaPill key={p.label} label={p.label} value={p.value} variant={p.variant} />
              ))}
            </div>
          </div>
        )}

        {isOwner && (pieceCollections.length > 0 || userCollections.length > 0) && (
          <div className="mt-9">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6B6358]">
                collections
              </p>
              <Link
                href="/collections"
                className="text-[12px] text-[#999999] transition-colors hover:text-[#111111]"
              >
                manage
              </Link>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {pieceCollections.map((c) => (
                <span
                  key={c.id}
                  className="rounded-full border border-[#2D5A45] px-3.5 py-1.5 text-[13px] text-[#2D5A45]"
                >
                  {c.name.toLowerCase()}
                </span>
              ))}
              <PieceCollectionButton pieceId={piece.id} collections={userCollections} />
            </div>
          </div>
        )}

        {storyParagraphs.length > 0 && (
          <div className="mt-9 border-l-2 border-[#2D5A45] pl-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#2D5A45]">
              story
            </p>
            {storyParagraphs.map((para: string, i: number) => (
              <p
                key={i}
                className={`whitespace-pre-wrap text-[16px] leading-[1.7] text-[#1B1A17]${i > 0 ? " mt-4" : " mt-3"}`}
              >
                {para}
              </p>
            ))}
          </div>
        )}

        {isOwner && (
          <div className="mt-12">
            <DeletePieceModal
              pieceId={piece.id}
              pieceName={displayName}
              buttonClassName="text-[12px] text-[#999999] transition-colors hover:text-red-500"
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
    </OwnerPageShell>
  );
}
