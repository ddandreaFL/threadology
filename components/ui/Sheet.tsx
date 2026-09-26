"use client";

import { useEffect, type ReactNode } from "react";

/**
 * A sheet: on a phone it rises from the bottom with the app's handle and a
 * "done"; on a desktop it is a centered panel. `tone="dark"` is the app's
 * dark sheet (collection picker, gallery settings).
 */
export function Sheet({
  open,
  onClose,
  title,
  tone = "light",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  tone?: "light" | "dark";
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  const dark = tone === "dark";
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center lg:items-center" role="dialog" aria-modal aria-label={title}>
      <button aria-label="close" onClick={onClose} className="absolute inset-0 animate-[fadeIn_200ms_ease-out] bg-black/30" />
      <div
        className={`relative w-full max-h-[85dvh] overflow-y-auto rounded-t-[24px] px-5 pb-[max(env(safe-area-inset-bottom),24px)] pt-4 font-th-sans animate-[sheetUp_280ms_cubic-bezier(0.2,0.8,0.2,1)] lg:max-w-md lg:rounded-[24px] lg:pb-6 ${
          dark ? "bg-[#1A1A1A] text-white" : "bg-white text-th-ink"
        }`}
      >
        <div className={`mx-auto mb-4 h-1 w-9 rounded-full lg:hidden ${dark ? "bg-white/20" : "bg-black/10"}`} />
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold">{title}</h2>
          <button onClick={onClose} className={`text-[14px] font-medium ${dark ? "text-white/50" : "text-th-muted"}`}>
            done
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
