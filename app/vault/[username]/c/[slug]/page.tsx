import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createServerClient } from "@/lib/supabase-server";
import { VaultGrid } from "@/components/vault/vault-grid";

interface Props {
  params: { username: string; slug: string };
}

export default async function CollectionPage({ params }: Props) {
  const supabase = await createServerClient();

  const { data: profile } = await supabase
    .from("users")
    .select("id, username")
    .eq("username", params.username)
    .single();

  if (!profile) notFound();

  const { data: collection } = await supabase
    .from("collections")
    .select("id, name, slug, description")
    .eq("user_id", profile.id)
    .eq("slug", params.slug)
    .single();

  if (!collection) notFound();

  const { data: collectionPieces } = await supabase
    .from("collection_pieces")
    .select("pieces(id, brand, type, name, year, photos, crop_positions)")
    .eq("collection_id", collection.id)
    .order("position");

  const pieces = (collectionPieces ?? [])
    .map((cp) => cp.pieces)
    .filter(Boolean) as NonNullable<typeof collectionPieces>[number]["pieces"][];

  return (
    <div className="pb-24">
      <Link
        href={`/vault/${params.username}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-gray-700"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to vault
      </Link>

      <div className="mb-6">
        <h1 className="font-mono-display text-2xl text-gray-900">{collection.name}</h1>
        {collection.description && (
          <p className="mt-1 text-sm text-gray-500">{collection.description}</p>
        )}
        <p className="mt-2 font-mono-display text-xs text-gray-400">
          {pieces.length} {pieces.length === 1 ? "piece" : "pieces"}
        </p>
      </div>

      {pieces.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#C8BFB0] bg-[#FDFCFA] py-24 text-center">
          <p className="text-gray-500">No pieces in this collection yet.</p>
          <p className="mt-1 text-sm text-gray-400">
            Open a piece and use &ldquo;Add to Collection&rdquo; to add it here.
          </p>
        </div>
      ) : (
        <VaultGrid pieces={pieces} basePath={`/vault/${params.username}`} />
      )}
    </div>
  );
}
