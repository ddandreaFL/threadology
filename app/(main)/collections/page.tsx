import { requireUser, getUserProfile } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { FREE_COLLECTION_LIMIT } from "@/lib/subscription";
import { CollectionList } from "@/components/collections/collection-list";
import { CreateCollectionForm } from "@/components/collections/create-collection-form";
import Link from "next/link";

export default async function CollectionsPage() {
  const user = await requireUser();
  const [profile, supabase] = await Promise.all([
    getUserProfile(user.id),
    createServerClient(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const [{ data: collections }, { data: userData }] = await Promise.all([
    db.from("collections")
      .select("id, name, slug, description, collection_pieces(count)")
      .eq("user_id", user.id)
      .order("position"),
    supabase.from("users").select("is_premium").eq("id", user.id).single(),
  ]);

  const isPremium = userData?.is_premium ?? false;
  const collectionCount = collections?.length ?? 0;
  const atLimit = !isPremium && collectionCount >= FREE_COLLECTION_LIMIT;

  return (
    <div className="mx-auto max-w-lg pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-medium tracking-[-0.02em] text-[#111111]">collections</h1>
        {!atLimit && (
          <CreateCollectionForm disabled={false} compact />
        )}
      </div>

      {!isPremium && (
        <p className="mt-2 text-[12px] text-[#999999]">
          {collectionCount} of {FREE_COLLECTION_LIMIT} ·{" "}
          <Link href="/upgrade" className="text-[#2D5A45]">
            upgrade for unlimited →
          </Link>
        </p>
      )}

      <div className="mt-5 border-t border-[#EBEBEB]">
        <CollectionList collections={collections ?? []} username={profile?.username ?? ""} />
      </div>

      {atLimit && (
        <div className="mt-4">
          <CreateCollectionForm disabled={true} />
        </div>
      )}
    </div>
  );
}
