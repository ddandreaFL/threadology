"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "@/lib/actions/auth";
import { supabase } from "@/lib/supabase";

interface SlideOverMenuProps {
  open: boolean;
  onClose: () => void;
  username: string;
  userId: string;
}

interface Stats {
  pieceCount: number;
  collectionCount: number;
  joinYear: number;
}

const NAV_ROWS = [
  { label: "vault", href: "/vault" },
  { label: "collections", href: "/collections" },
  { label: "profile", href: "/profile" },
  { label: "settings", href: "/settings" },
] as const;

export function SlideOverMenu({ open, onClose, username, userId }: SlideOverMenuProps) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!open || stats) return;
    async function load() {
      const [{ count: pieces }, { count: collections }, { data: userData }] = await Promise.all([
        (supabase as any).from("pieces").select("id", { count: "exact", head: true }).eq("user_id", userId),
        (supabase as any).from("collections").select("id", { count: "exact", head: true }).eq("user_id", userId),
        (supabase as any).from("users").select("created_at").eq("id", userId).single(),
      ]);
      setStats({
        pieceCount: pieces ?? 0,
        collectionCount: collections ?? 0,
        joinYear: userData?.created_at ? new Date(userData.created_at).getFullYear() : new Date().getFullYear(),
      });
    }
    load();
  }, [open, userId, stats]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-200 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-[300px] max-w-full bg-white shadow-xl transition-transform duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Profile summary */}
        <div className="flex items-center gap-3 px-5 pt-14 pb-5 border-b border-[#EBEBEB]">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1A1A1A] text-[14px] font-semibold text-white shrink-0">
            {username.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-medium text-[#111111] truncate">@{username}</p>
            {stats && (
              <p className="text-[11px] text-[#999999] mt-0.5">
                {stats.pieceCount} pieces · {stats.collectionCount} collections · since {stats.joinYear}
              </p>
            )}
          </div>
        </div>

        {/* Nav rows */}
        <nav className="flex flex-col py-2">
          {NAV_ROWS.map((row) => (
            <Link
              key={row.href}
              href={row.href}
              onClick={onClose}
              className="px-5 py-4 text-[15px] font-medium text-[#111111] hover:bg-[#F7F7F7] transition-colors border-b border-[#EBEBEB]"
            >
              {row.label}
            </Link>
          ))}
        </nav>

        {/* Sign out */}
        <div className="absolute bottom-10 left-0 right-0 px-5">
          <form action={signOut}>
            <button
              type="submit"
              className="text-[15px] text-[#CC4444]"
            >
              sign out
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
