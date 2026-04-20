import { requireUser, getUserProfile } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { getUserSubscription, FREE_COLLECTION_LIMIT } from "@/lib/subscription";
import { CollectionList } from "@/components/collections/collection-list";
import { CreateCollectionForm } from "@/components/collections/create-collection-form";
import Link from "next/link";

export default async function CollectionsPage() {
  const user = await requireUser();
  const [profile, subscription, supabase] = await Promise.all([
    getUserProfile(user.id),
    getUserSubscription(user.id),
    createServerClient(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: collections } = await db
    .from("collections")
    .select("id, name, slug, description, collection_pieces(count)")
    .eq("user_id", user.id)
    .order("position");

  const atLimit = !subscription.isPremium && subscription.collectionCount >= FREE_COLLECTION_LIMIT;

  return (
    <div className="mx-auto max-w-lg pb-24">
      <h1 className="font-serif text-2xl text-gray-900">Collections</h1>
      <p className="mt-1 font-mono-display text-xs text-gray-400">
        @{profile?.username}
      </p>

      {!subscription.isPremium && (
        <p className="mt-4 text-sm text-gray-500">
          {subscription.collectionCount} of {FREE_COLLECTION_LIMIT} collections ·{" "}
          <Link href="/upgrade" className="text-[#2D5A45] hover:underline">
            Upgrade for unlimited →
          </Link>
        </p>
      )}

      <div className="mt-6">
        <CreateCollectionForm disabled={atLimit} />
        <CollectionList collections={collections ?? []} username={profile?.username ?? ""} />
      </div>
    </div>
  );
}
