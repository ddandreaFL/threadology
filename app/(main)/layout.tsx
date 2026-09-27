import { requireUser, getUserProfile } from "@/lib/auth";
import { AppFrame } from "@/components/ui/AppFrame";

/**
 * The signed-in app: the pill tab bar on a phone, the side column on a
 * desktop (components/ui/AppFrame). Each screen draws its own header, as in
 * the app.
 */
export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const profile = await getUserProfile(user.id);
  const username = profile?.username ?? user.email?.split("@")[0] ?? "you";
  return <AppFrame username={username}>{children}</AppFrame>;
}
