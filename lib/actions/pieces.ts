"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase-server";
import { requireUser } from "@/lib/auth";
import type { Database } from "@/types/supabase";

type PieceInsert = Database["public"]["Tables"]["pieces"]["Insert"];

type PieceFields = Pick<
  PieceInsert,
  "brand" | "type" | "name" | "year" | "season" | "size" | "condition" | "made_in" | "story" | "photos" | "is_private"
>;

/**
 * Save a new piece, as the app's add flow does: the piece, its estimated
 * value (owner-only, in piece_private) and the collections it goes into.
 * Photos are uploaded by the browser first; this takes their URLs.
 */
export async function addPiece(
  data: PieceFields,
  extras: { estimatedValue: number | null; collectionIds: string[] }
): Promise<{ id: string } | { error: string }> {
  const user = await requireUser();
  const supabase = await createServerClient();
  const { data: inserted, error } = await supabase
    .from("pieces")
    .insert({ ...data, user_id: user.id })
    .select("id")
    .single();
  if (error) return { error: error.message };

  if (extras.collectionIds.length > 0) {
    await supabase
      .from("collection_pieces")
      .insert(extras.collectionIds.map((collection_id) => ({ collection_id, piece_id: inserted.id })));
  }
  // The piece is saved; a missing value is not worth failing it over.
  if (extras.estimatedValue !== null) {
    await supabase.from("piece_private").upsert({ piece_id: inserted.id, estimated_value: extras.estimatedValue }, { onConflict: "piece_id" });
  }

  revalidatePath("/vault");
  return { id: inserted.id };
}

export async function updatePiece(
  pieceId: string,
  data: PieceFields,
  estimatedValue: number | null
): Promise<{ error: string } | { ok: true }> {
  const user = await requireUser();
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("pieces")
    .update(data)
    .eq("id", pieceId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  // Owner-only, so it lives in piece_private rather than on the piece — the
  // same place the app writes it. RLS scopes the row to the piece's owner.
  const { error: privateError } = await supabase
    .from("piece_private")
    .upsert({ piece_id: pieceId, estimated_value: estimatedValue }, { onConflict: "piece_id" });

  if (privateError) return { error: privateError.message };

  revalidatePath("/vault");
  revalidatePath(`/pieces/${pieceId}`);
  return { ok: true };
}

export async function updateCropPositions(
  pieceId: string,
  cropPositions: Record<string, { x: number; y: number }>
) {
  const user = await requireUser();
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("pieces")
    .update({ crop_positions: cropPositions })
    .eq("id", pieceId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
}

export async function deletePiece(pieceId: string) {
  const user = await requireUser();
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("pieces")
    .delete()
    .eq("id", pieceId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
}
