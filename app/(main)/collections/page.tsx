import { requireUser, getUserProfile } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { CollectionList } from "@/components/collections/collection-list";
import { CreateCollectionForm } from "@/components/collections/create-collection-form";

export default async function CollectionsPage() {
  const user = await requireUser();
  const [profile, supabase] = await Promise.all([
    getUserProfile(user.id),
    createServerClient(),
  ]);

  const { data: collections } = await supabase
    .from("collections")
    .select("id, name, slug, description, collection_pieces(count)")
    .eq("user_id", user.id)
    .order("position");

  return (
    <div className="mx-auto max-w-lg pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-medium tracking-[-0.02em] text-[#111111]">collections</h1>
        <CreateCollectionForm disabled={false} compact />
      </div>


      <div className="mt-5 border-t border-[#EBEBEB]">
        <CollectionList collections={collections ?? []} username={profile?.username ?? ""} />
      </div>

    </div>
  );
}
