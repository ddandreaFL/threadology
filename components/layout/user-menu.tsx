"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "@/lib/actions/auth";

interface UserMenuProps {
  username: string;
  avatarUrl: string | null;
}

export function UserMenu({ username, avatarUrl }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initial = username.charAt(0).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open user menu"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2D5A45] text-sm font-semibold text-white transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A45]/50"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={username}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          initial
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 min-w-[160px] overflow-hidden rounded-xl border border-[#E0D8CC] bg-white shadow-md">
          <div className="border-b border-[#E0D8CC] px-4 py-2.5">
            <p className="text-xs text-gray-500">Signed in as</p>
            <p className="truncate text-sm font-medium text-gray-900">@{username}</p>
          </div>

          <nav className="flex flex-col py-1">
            <Link
              href="/vault"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-[#F5F1EA]"
            >
              Your Vault
            </Link>
            <Link
              href="/fit/new"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-[#F5F1EA]"
            >
              Log a Fit
            </Link>
          </nav>

          <div className="border-t border-[#E0D8CC] py-1">
            <form action={signOut}>
              <button
                type="submit"
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-[#F5F1EA]"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
