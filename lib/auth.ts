import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import type { Database } from "@/types/supabase";

// stripe_customer_id is deliberately absent: it is not in the column grant on
// public.users (supabase/migrations/security_fixes_2.sql), so selecting it as
// the `authenticated` role fails. Server code that needs it calls the
// my_stripe_customer_id() RPC, which returns it for the caller's own row only.
const PROFILE_COLUMNS = "id, username, avatar_url, bio, is_premium, created_at";

type UserProfile = Omit<
  Database["public"]["Tables"]["users"]["Row"],
  "stripe_customer_id"
>;

// Returns the authenticated auth.users record, or null if not signed in.
export async function getUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Returns the authenticated user, redirecting to /login if not signed in.
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

// Returns the public profile row for the given user id, or null.
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("users")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .single();
  return data;
}
