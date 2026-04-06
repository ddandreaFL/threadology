import { createServerClient } from "@/lib/supabase-server";

export const FREE_PIECE_LIMIT = 25;

export async function getUserSubscription(userId: string): Promise<{
  isPremium: boolean;
  pieceCount: number;
  pieceLimit: number;
}> {
  const supabase = await createServerClient();

  const [profileResult, countResult] = await Promise.all([
    supabase.from("users").select("is_premium").eq("id", userId).single(),
    supabase
      .from("pieces")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  const isPremium = profileResult.data?.is_premium ?? false;
  const pieceCount = countResult.count ?? 0;
  const pieceLimit = isPremium ? Infinity : FREE_PIECE_LIMIT;

  return { isPremium, pieceCount, pieceLimit };
}
