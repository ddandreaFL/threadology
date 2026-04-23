import { createServerClient } from "@/lib/supabase-server";

export const FREE_PIECE_LIMIT = 25;
export const FREE_COLLECTION_LIMIT = 3;

export async function getUserSubscription(userId: string) {
  const supabase = await createServerClient();
  const [userResult, pieceCountResult, collectionCountResult] = await Promise.all([
    supabase.from("users").select("is_premium").eq("id", userId).single(),
    supabase.from("pieces").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("collections").select("*", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  const isPremium = userResult.data?.is_premium ?? false;
  const pieceCount = pieceCountResult.count ?? 0;
  const collectionCount = collectionCountResult.count ?? 0;

  return {
    isPremium,
    pieceCount,
    pieceLimit: isPremium ? Infinity : FREE_PIECE_LIMIT,
    collectionCount,
    collectionLimit: isPremium ? Infinity : FREE_COLLECTION_LIMIT,
  };
}
