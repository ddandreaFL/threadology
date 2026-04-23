import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import type { Database } from "@/types/supabase";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];

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
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}
