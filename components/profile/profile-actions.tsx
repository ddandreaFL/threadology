"use client";

import Link from "next/link";
import { signOut } from "@/lib/actions/auth";

interface ProfileActionsProps {
  username: string;
}

// Sharing lives on the vault now, with a real link: the bare
// /vault/<username> URL this used to copy has been dead since links moved
// to tokens.
export function ProfileActions({ username }: ProfileActionsProps) {
  void username;

  return (
    <div className="mt-5">
      {/* Action buttons */}
      <div className="flex gap-[10px]">
        <Link
          href="/vault"
          className="flex-1 rounded-[10px] bg-[#1A1A1A] px-3 py-3 text-center text-[13px] font-medium text-white transition-opacity hover:opacity-80"
        >
          share vault
        </Link>
        <Link
          href="/settings"
          className="flex-1 rounded-[10px] border border-[#E0E0E0] px-3 py-3 text-center text-[13px] font-medium text-[#111111] transition-colors hover:bg-gray-50"
        >
          edit profile
        </Link>
      </div>

      {/* Settings list */}
      <div className="mt-6 border-t border-[#F0F0F0]">

        <Link
          href="/collections"
          className="flex items-center justify-between border-b border-[#F8F8F8] px-5 py-[14px]"
        >
          <span className="text-[14px] text-[#111111]">collections</span>
          <svg className="h-4 w-4 text-[#999999]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center justify-between border-b border-[#F8F8F8] px-5 py-[14px]"
          >
            <span className="text-[14px] text-[#CC4444]">sign out</span>
          </button>
        </form>
      </div>
    </div>
  );
}
