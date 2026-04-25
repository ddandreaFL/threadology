"use client";

import { useState } from "react";
import { VaultUIProvider } from "./VaultUIContext";
import { TopBar } from "./TopBar";
import { SlideOverMenu } from "./SlideOverMenu";

interface AppShellProps {
  children: React.ReactNode;
  username: string;
  initial: string;
  userId: string;
}

export function AppShell({ children, username, initial, userId }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <VaultUIProvider>
      <div className="min-h-screen bg-white">
        <TopBar initial={initial} onAvatarPress={() => setMenuOpen(true)} />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <SlideOverMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          username={username}
          userId={userId}
        />
      </div>
    </VaultUIProvider>
  );
}
