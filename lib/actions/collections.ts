"use server";

import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/utils";

export async function createCollection(data: { name: string; description?: string }) {
  const user = await requireUser();
  const supabase = await createServerClient();
  const slug = slugify(data.name);

  const { data: collection, error } = await supabase
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
  const supabase = await createServerClient();

  const { error } = await supabase
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
  const supabase = await createServerClient();

  const { data: userCollections } = await supabase
    .from("collections")
    .select("id")
    .eq("user_id", user.id);

  const userCollectionIds = (userCollections ?? []).map((c) => c.id);

  if (userCollectionIds.length > 0) {
    await supabase
      .from("collection_pieces")
      .delete()
      .eq("piece_id", pieceId)
      .in("collection_id", userCollectionIds);
  }

  if (collectionIds.length > 0) {
    await supabase.from("collection_pieces").insert(
      collectionIds.map((collection_id) => ({ collection_id, piece_id: pieceId }))
    );
  }

  revalidatePath("/vault");
  return { success: true };
}

export async function getPieceCollections(pieceId: string): Promise<string[]> {
  const user = await requireUser();
  const supabase = await createServerClient();

  const { data } = await supabase
    .from("collection_pieces")
    .select("collection_id, collections!inner(user_id)")
    .eq("piece_id", pieceId)
    .eq("collections.user_id", user.id);

  return (data ?? []).map((cp) => cp.collection_id);
}

/** Rename a collection. The slug follows the name, as in the app. */
export async function renameCollection(collectionId: string, name: string) {
  const user = await requireUser();
  const trimmed = name.trim();
  if (!trimmed) return { error: "A collection needs a name." };
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("collections")
    .update({ name: trimmed, slug: slugify(trimmed) })
    .eq("id", collectionId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/collections");
  revalidatePath(`/collections/${collectionId}`);
  return { success: true };
}

/**
 * Set exactly which pieces a collection holds — the collection edit card's
 * save. Only the difference is written, so a piece's place is kept.
 */
export async function setCollectionPieces(collectionId: string, pieceIds: string[]) {
  const user = await requireUser();
  const supabase = await createServerClient();
  const { data: owned } = await supabase.from("collections").select("id").eq("id", collectionId).eq("user_id", user.id).maybeSingle();
  if (!owned) return { error: "Collection not found." };

  const { data: rows } = await supabase.from("collection_pieces").select("piece_id").eq("collection_id", collectionId);
  const current = new Set((rows ?? []).map((r) => r.piece_id));
  const wanted = new Set(pieceIds);
  const out = Array.from(current).filter((id) => !wanted.has(id));
  const add = Array.from(wanted).filter((id) => !current.has(id));

  if (out.length) {
    const { error } = await supabase.from("collection_pieces").delete().eq("collection_id", collectionId).in("piece_id", out);
    if (error) return { error: error.message };
  }
  if (add.length) {
    const { error } = await supabase.from("collection_pieces").insert(add.map((piece_id) => ({ collection_id: collectionId, piece_id })));
    if (error) return { error: error.message };
  }
  revalidatePath(`/collections/${collectionId}`);
  revalidatePath("/collections");
  return { success: true };
}
