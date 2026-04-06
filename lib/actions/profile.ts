"use server";

import { createServerClient } from "@/lib/supabase-server";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const user = await requireUser();
  const supabase = await createServerClient();

  const bio = (formData.get("bio") as string | null) ?? null;
  const avatarUrl = (formData.get("avatar_url") as string | null) ?? null;

  const update: { bio?: string | null; avatar_url?: string | null } = {
    bio: bio?.trim() || null,
  };
  if (avatarUrl !== null) update.avatar_url = avatarUrl;

  const { error } = await supabase
    .from("users")
    .update(update)
    .eq("id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/settings");

  const { data: profile } = await supabase
    .from("users")
    .select("username")
    .eq("id", user.id)
    .single();

  if (profile?.username) revalidatePath(`/vault/${profile.username}`);
}
