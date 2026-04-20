"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "@/lib/actions/auth";

interface UserMenuProps {
  username: string;
  avatarUrl: string | null;
  isPremium: boolean;
}

export function UserMenu({ username, avatarUrl, isPremium }: UserMenuProps) {
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
    <div ref={ref} className="relative flex items-center gap-0.5">
      {/* Avatar → /profile */}
      <Link
        href="/profile"
        aria-label="View profile"
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
      </Link>

      {/* Chevron → opens dropdown */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open user menu"
        aria-expanded={open}
        className="flex h-6 w-5 items-center justify-center rounded text-gray-400 transition-colors hover:text-gray-700 focus:outline-none"
      >
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="animate-dropdown-enter absolute right-0 top-10 z-50 min-w-[160px] overflow-hidden rounded-xl border border-[#E0D8CC] bg-white shadow-md">
          <div className="border-b border-[#E0D8CC] px-4 py-2.5">
            <p className="text-xs text-gray-500">Signed in as</p>
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-gray-900">@{username}</p>
              {isPremium && (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#2D5A45]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#2D5A45]">
                  <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M6 0l1.5 4h4l-3.25 2.5 1.25 4L6 8.25 2.5 10.5l1.25-4L.5 4h4z" />
                  </svg>
                  Premium
                </span>
              )}
            </div>
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
            <Link
              href="/collections"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-[#F5F1EA]"
            >
              Collections
            </Link>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-[#F5F1EA]"
            >
              Settings
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
