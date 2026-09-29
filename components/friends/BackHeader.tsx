"use client";

import { useRouter } from "next/navigation";
import { ChipButton } from "@/components/ui/ChipButton";

/** A back chip that goes back, the title centered — the app's pushed-screen header. */
export function BackHeader({ title, fallback = "/profile" }: { title: string; fallback?: string }) {
  const router = useRouter();
  return (
    <header className="flex items-center px-5 pb-3.5 pt-[15px] font-th-sans">
      <ChipButton icon="chevron-left" label="back" onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))} />
      <h1 className="min-w-0 flex-1 truncate text-center text-[17px] font-bold tracking-[-0.01em]">{title}</h1>
      <span className="w-11" />
    </header>
  );
}
