"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Check, Settings, ExternalLink } from "lucide-react";

export function ProfileActions({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(
      `${window.location.origin}/vault/${username}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const rowCls =
    "flex w-full items-center gap-3 rounded-xl border border-[#E0D8CC] bg-[#FDFCFA] px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-white";

  return (
    <div className="mb-8 space-y-2">
      <button onClick={copyLink} className={rowCls}>
        {copied ? (
          <Check className="h-4 w-4 text-[#2D5A45]" />
        ) : (
          <Copy className="h-4 w-4 text-gray-400" />
        )}
        <span>{copied ? "Copied!" : "Copy vault link"}</span>
      </button>

      <Link href="/settings" className={rowCls}>
        <Settings className="h-4 w-4 text-gray-400" />
        <span>Edit profile</span>
      </Link>

      <Link href={`/vault/${username}`} className={rowCls}>
        <ExternalLink className="h-4 w-4 text-gray-400" />
        <span>View public vault</span>
      </Link>
    </div>
  );
}
