"use server";

import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/utils";
import { getUserSubscription, FREE_COLLECTION_LIMIT } from "@/lib/subscription";

export async function createCollection(data: { name: string; description?: string }) {
  const user = await requireUser();
  const { isPremium, collectionCount } = await getUserSubscription(user.id);

  if (!isPremium && collectionCount >= FREE_COLLECTION_LIMIT) {
    return { error: "Collection limit reached. Upgrade to Premium for unlimited collections." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createServerClient()) as any;
  const slug = slugify(data.name);

  const { data: collection, error } = await db
    .from("collections")
    .insert({ user_id: user.id, name: data.name, slug, description: data.description })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/collections");
  return { collection };
}

export async function deleteCollection(collectionId: string) {
  const user = await requireUser();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createServerClient()) as any;

  const { error } = await db
    .from("collections")
    .delete()
    .eq("id", collectionId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/collections");
  return { success: true };
}

export async function addPieceToCollections(pieceId: string, collectionIds: string[]) {
  const user = await requireUser();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createServerClient()) as any;

  const { data: userCollections } = await db
    .from("collections")
    .select("id")
    .eq("user_id", user.id);

  const userCollectionIds = (userCollections as { id: string }[] ?? []).map((c) => c.id);

  if (userCollectionIds.length > 0) {
    await db
      .from("collection_pieces")
      .delete()
      .eq("piece_id", pieceId)
      .in("collection_id", userCollectionIds);
  }

  if (collectionIds.length > 0) {
    await db.from("collection_pieces").insert(
      collectionIds.map((collection_id) => ({ collection_id, piece_id: pieceId }))
    );
  }

  revalidatePath("/vault");
  return { success: true };
}

export async function getPieceCollections(pieceId: string): Promise<string[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createServerClient()) as any;
  const { data } = await db
    .from("collection_pieces")
    .select("collection_id")
    .eq("piece_id", pieceId);

  return (data as { collection_id: string }[] ?? []).map((cp) => cp.collection_id);
}
