"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase-server";
import { requireUser } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export interface FitFields {
  photos: string[];
  /** Piece ids, in the order they were worn. */
  pieceIds: string[];
  title: string | null;
  caption: string | null;
  /** Where it was worn — free text for now; a place lookup can come later. */
  location: string | null;
  date: string;
}

const randomSlug = () => Math.random().toString(36).slice(2, 8);

/**
 * Log a fit, as the app does: the slug comes from the title, and a taken
 * one gets a short suffix. Private until its owner shares it — "link_only"
 * with no token minted was a fit marked shareable that nobody could open.
 */
export async function createFit(data: FitFields): Promise<{ id: string } | { error: string }> {
  const user = await requireUser();
  const supabase = await createServerClient();
  const base = slugify(data.title ?? "") || randomSlug();
  const row = (slug: string) => ({
    user_id: user.id,
    slug,
    title: data.title,
    caption: data.caption,
    location: data.location,
    date: data.date,
    photos: data.photos,
    visibility: "private" as const,
  });

  let { data: fit, error } = await supabase.from("fits").insert(row(base)).select("id").single();
  if (error?.code === "23505") {
    ({ data: fit, error } = await supabase.from("fits").insert(row(`${base}-${randomSlug()}`)).select("id").single());
  }
  if (error || !fit) return { error: error?.message ?? "Couldn't save the fit." };

  await linkPieces(fit.id, data.pieceIds);
  revalidatePath("/fits");
  return { id: fit.id };
}

/** Edit a fit. The slug stays put: it is in links already sent. */
export async function updateFit(fitId: string, data: FitFields): Promise<{ ok: true } | { error: string }> {
  const user = await requireUser();
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("fits")
    .update({ title: data.title, caption: data.caption, location: data.location, date: data.date, photos: data.photos })
    .eq("id", fitId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  // Replace the pieces: all out, then back in the chosen order.
  await supabase.from("fit_pieces").delete().eq("fit_id", fitId);
  await linkPieces(fitId, data.pieceIds);
  revalidatePath("/fits");
  revalidatePath(`/fits/${fitId}`);
  return { ok: true };
}

export async function deleteFit(fitId: string): Promise<{ ok: true } | { error: string }> {
  const user = await requireUser();
  const supabase = await createServerClient();
  const { error } = await supabase.from("fits").delete().eq("id", fitId).eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/fits");
  return { ok: true };
}

async function linkPieces(fitId: string, pieceIds: string[]) {
  if (pieceIds.length === 0) return;
  const supabase = await createServerClient();
  await supabase.from("fit_pieces").insert(pieceIds.map((piece_id, layer_order) => ({ fit_id: fitId, piece_id, layer_order })));
}
