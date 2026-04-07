"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { requireUser } from "@/lib/auth";
import { getUserSubscription } from "@/lib/subscription";
import type { Database } from "@/types/database";

type PieceInsert = Database["public"]["Tables"]["pieces"]["Insert"];

export async function addPiece(
  data: Omit<PieceInsert, "id" | "user_id" | "created_at" | "updated_at">
): Promise<{ error: string } | undefined> {
  const user = await requireUser();

  const { isPremium, pieceCount, pieceLimit } = await getUserSubscription(user.id);
  if (!isPremium && pieceCount >= pieceLimit) {
    return { error: "Piece limit reached. Upgrade to premium to add more." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.from("pieces").insert({
    ...data,
    user_id: user.id,
  });

  if (error) return { error: error.message };

  redirect("/vault");
}

export async function updatePiece(
  pieceId: string,
  data: Pick<
    PieceInsert,
    "brand" | "type" | "name" | "year" | "season" | "size" | "condition" | "story" | "photos" | "estimated_value" | "acquisition_method"
  >
) {
  const user = await requireUser();
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("pieces")
    .update(data)
    .eq("id", pieceId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

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
