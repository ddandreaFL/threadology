"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { requireUser } from "@/lib/auth";
import type { Database } from "@/types/supabase";

type PieceInsert = Database["public"]["Tables"]["pieces"]["Insert"];

export async function addPiece(
  data: Omit<PieceInsert, "id" | "user_id" | "created_at" | "updated_at">
): Promise<{ error: string } | undefined> {
  const user = await requireUser();


  const supabase = await createServerClient();
  const { data: inserted, error } = await supabase
    .from("pieces")
    .insert({ ...data, user_id: user.id })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const { data: profile } = await supabase
    .from("users")
    .select("username")
    .eq("id", user.id)
    .single();

  redirect(`/vault/${profile?.username ?? user.id}/${inserted.id}`);
}

export async function updatePiece(
  pieceId: string,
  data: Pick<
    PieceInsert,
    "brand" | "type" | "name" | "year" | "season" | "size" | "condition" | "made_in" | "story" | "photos" | "acquisition_method"
  >,
  estimatedValue: number | null
) {
  const user = await requireUser();
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("pieces")
    .update(data)
    .eq("id", pieceId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  // Owner-only, so it lives in piece_private rather than on the piece — the
  // same place the app writes it. RLS scopes the row to the piece's owner.
  const { error: privateError } = await supabase
    .from("piece_private")
    .upsert({ piece_id: pieceId, estimated_value: estimatedValue }, { onConflict: "piece_id" });

  if (privateError) throw new Error(privateError.message);

  const { data: profile } = await supabase
    .from("users")
    .select("username")
    .eq("id", user.id)
    .single();

  redirect(`/vault/${profile?.username ?? user.id}/${pieceId}`);
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
