import { redirect } from "next/navigation";
import { requireUser, getUserProfile } from "@/lib/auth";

export default async function VaultPage() {
  const user = await requireUser();
  const profile = await getUserProfile(user.id);
  const username = profile?.username ?? user.id;
  redirect(`/vault/${username}`);
}
