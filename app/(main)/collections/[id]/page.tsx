import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { requireUser, getUserProfile } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { getShareState } from "@/lib/share-state";
import { ShareControl } from "@/components/sharing/share-control";

/**
 * One of your collections, signed in. The web's collections list had rows
 * with an arrow that led nowhere; this is where they go — the pieces, and
 * the collection's sharing, as in the app.
 */
export default async function OwnerCollectionPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const [profile, supabase] = await Promise.all([getUserProfile(user.id), createServerClient()]);
  if (!profile) notFound();

  const { data: collection } = await supabase
    .from("collections")
    .select("id, name, description, collection_pieces(pieces(id, name, type, brand, year, photos, created_at))")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();
  if (!collection) notFound();

  type P = { id: string; name: string | null; type: string; brand: string; year: string | null; photos: string[]; created_at: string };
  const pieces = ((collection.collection_pieces ?? []) as { pieces: P | null }[])
    .map((cp) => cp.pieces)
    .filter((p): p is P => !!p)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const share = await getShareState(supabase, "collection", collection.id);

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <Link href="/collections" className="text-[13px] text-[#999999] transition-colors hover:text-[#111111]">
        ← collections
      </Link>
      <h1 className="mt-6 text-[22px] font-medium tracking-[-0.02em] text-[#111111]">{collection.name}</h1>
      <p className="mt-1 text-[12px] text-[#999999]">
        {pieces.length} {pieces.length === 1 ? "piece" : "pieces"}
        {collection.description ? ` · ${collection.description}` : ""}
      </p>

      <div className="mt-6">
        <ShareControl type="collection" id={collection.id} username={profile.username} initial={share} />
      </div>

      {pieces.length === 0 ? (
        <p className="py-20 text-center text-[13px] text-[#999999]">
          Nothing in here yet. Add pieces from a piece&apos;s page.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-6">
          {pieces.map((p) => (
            <Link key={p.id} href={`/vault/${profile.username}/${p.id}`} className="block">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#F5F5F5]">
                {p.photos?.[0] ? <Image src={p.photos[0]} alt={p.name ?? p.type} fill sizes="(max-width: 768px) 50vw, 320px" className="object-cover" /> : null}
              </div>
              <p className="mt-2 truncate text-[13px] font-medium text-[#111111]">{p.name ?? p.type}</p>
              <p className="mt-0.5 truncate text-[11px] text-[#999999]">{[p.brand, p.year].filter(Boolean).join(" · ")}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
