import { createServerClient } from "@/lib/supabase-server";

/**
 * Whether the person looking at a share link is the person who made it.
 *
 * An owner who opens their own link should not be shown the visitor page:
 * with the app shell gone it reads as somebody else's archive, which is
 * exactly the confusion it caused. Pages use this to send them to their own
 * screen instead — unless they asked to preview the link deliberately.
 */
export async function viewerIsOwner(username: string): Promise<boolean> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase
      .from("users")
      .select("username")
      .eq("id", user.id)
      .single();
    return (data as { username: string } | null)?.username === username;
  } catch {
    return false;
  }
}
