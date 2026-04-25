import { requireUser, getUserProfile } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const profile = await getUserProfile(user.id);

  const username = profile?.username ?? user.email?.split("@")[0] ?? "you";
  const initial = username.charAt(0).toUpperCase();

  return (
    <AppShell username={username} initial={initial} userId={user.id}>
      {children}
    </AppShell>
  );
}
