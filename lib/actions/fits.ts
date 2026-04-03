"use server";

import { createServerClient } from "@/lib/supabase-server";
import { requireUser } from "@/lib/auth";

interface CreateFitData {
  photos: string[];
  pieces: { id: string; layer_order: number }[];
  title: string | null;
  caption: string | null;
  date: string;
  location: string | null;
  slug: string;
}

export async function createFit(
  data: CreateFitData
): Promise<{ username: string; slug: string }> {
  const user = await requireUser();
  const supabase = await createServerClient();

  const { data: fit, error: fitError } = await supabase
    .from("fits")
    .insert({
      user_id: user.id,
      slug: data.slug,
      title: data.title,
      caption: data.caption,
      date: data.date,
      location: data.location,
      photos: data.photos,
      visibility: "link_only",
    })
    .select("id")
    .single();

  if (fitError) throw new Error(fitError.message);

  if (data.pieces.length > 0) {
    const { error: piecesError } = await supabase.from("fit_pieces").insert(
      data.pieces.map(({ id, layer_order }) => ({
        fit_id: fit.id,
        piece_id: id,
        layer_order,
      }))
    );
    if (piecesError) throw new Error(piecesError.message);
  }

  const { data: profile } = await supabase
    .from("users")
    .select("username")
    .eq("id", user.id)
    .single();

  return { username: profile?.username ?? user.id, slug: data.slug };
}
