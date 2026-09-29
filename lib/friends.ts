/**
 * Friends — mutual, request and accept (supabase/migrations/friends.sql),
 * read the same way the app reads them (threadology-native/lib/friends.ts).
 * Every call is a database function keyed on the signed-in user.
 */

export type Relationship = "self" | "friends" | "requested" | "incoming" | "none";
export type Person = { username: string; avatar_url: string | null; since?: string };

export type UserProfile = {
  user: { username: string; avatar_url: string | null; bio: string | null; created_at: string };
  relationship: Relationship;
  /** Present only for a friend (or yourself). */
  pieces?: { id: string; brand: string; type: string; name: string | null; photo: string | null }[];
  collections?: { id: string; name: string; count: number; photo: string | null }[];
  fits?: { id: string; title: string | null; date: string | null; photo: string | null }[];
};

export type MyFriends = { friends: Person[]; incoming: Person[]; outgoing: Person[] };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = { rpc: (fn: any, args?: any) => any };

export async function fetchUserProfile(supabase: Client, username: string): Promise<UserProfile | null> {
  const { data, error } = await supabase.rpc("user_profile", { p_username: username });
  return error ? null : ((data as UserProfile | null) ?? null);
}

export async function fetchMyFriends(supabase: Client): Promise<MyFriends> {
  const { data } = await supabase.rpc("my_friends");
  return (data as MyFriends | null) ?? { friends: [], incoming: [], outgoing: [] };
}

async function relationshipCall(supabase: Client, fn: string, args: Record<string, unknown>): Promise<Relationship | null> {
  const { data, error } = await supabase.rpc(fn, args);
  return error ? null : ((data?.relationship as Relationship) ?? null);
}

export const sendFriendRequest = (s: Client, username: string) => relationshipCall(s, "send_friend_request", { p_username: username });
export const respondFriendRequest = (s: Client, username: string, accept: boolean) =>
  relationshipCall(s, "respond_friend_request", { p_username: username, p_accept: accept });
export const removeFriend = (s: Client, username: string) => relationshipCall(s, "remove_friend", { p_username: username });
