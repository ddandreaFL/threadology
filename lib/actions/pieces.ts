"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { requireUser } from "@/lib/auth";
import type { Database } from "@/types/database";

type PieceInsert = Database["public"]["Tables"]["pieces"]["Insert"];

export async function addPiece(data: Omit<PieceInsert, "id" | "user_id" | "created_at" | "updated_at">) {
  const user = await requireUser();
  const supabase = await createServerClient();

  const { error } = await supabase.from("pieces").insert({
    ...data,
    user_id: user.id,
  });

  if (error) throw new Error(error.message);

  redirect("/vault");
}
