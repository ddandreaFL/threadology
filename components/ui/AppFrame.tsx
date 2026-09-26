import type { ReactNode } from "react";
import { SideNav } from "./SideNav";
import { TabBar } from "./TabBar";

/**
 * The owner's frame. Phones get the app's arrangement — full-width screens
 * with the pill tab bar floating over them (content clears it). Wide screens
 * get the desktop layout — the side column, and a content area whose width
 * each screen chooses.
 */
export function AppFrame({ username, children }: { username: string; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-th-bg text-th-ink">
      <SideNav username={username} />
      <main className="min-w-0 flex-1 pb-[calc(env(safe-area-inset-bottom)+124px)] lg:pb-16">{children}</main>
      <TabBar />
    </div>
  );
}
