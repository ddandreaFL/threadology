import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import type { Database } from "@/types/supabase";

// Exactly the columns in the public grant on public.users
// (supabase/migrations/users_column_grants.sql); selecting anything else as
// `authenticated` fails. The billing id and vault share settings are read
// through my_stripe_customer_id() / my_vault_share(), scoped to the caller.
const PROFILE_COLUMNS = "id, username, avatar_url, bio, is_premium, created_at";

// Picked, not omitted: a column added to users is private until granted, and
// the type should not claim it either.
type UserProfile = Pick<
  Database["public"]["Tables"]["users"]["Row"],
  "id" | "username" | "avatar_url" | "bio" | "is_premium" | "created_at"
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
