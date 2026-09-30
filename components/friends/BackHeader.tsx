"use client";

import { BackChip } from "@/components/ui/BackChip";

/** A back chip that goes back, the title centered — the app's pushed-screen header. */
export function BackHeader({ title, fallback = "/profile" }: { title: string; fallback?: string }) {
  return (
    <header className="flex items-center px-5 pb-3.5 pt-[15px] font-th-sans">
      <BackChip fallback={fallback} />
      <h1 className="min-w-0 flex-1 truncate text-center text-[17px] font-bold tracking-[-0.01em]">{title}</h1>
      <span className="w-11" />
    </header>
  );
}
