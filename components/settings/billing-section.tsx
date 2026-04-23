"use client";

import { useState } from "react";
import Link from "next/link";

export function BillingSection({ isPremium }: { isPremium: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED === "true";

  const handleManage = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing-portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Something went wrong");
        setLoading(false);
      }
    } catch {
      setError("Failed to open billing portal");
      setLoading(false);
    }
  };

  return (
    <div>
      <p className="py-3 text-[10px] uppercase tracking-[0.12em] text-[#999999]">billing</p>

      <div className="flex items-center justify-between border-b border-[#F0F0F0] py-[14px]">
        <div>
          <p className="text-[14px] text-[#111111]">{isPremium ? "premium plan" : "free plan"}</p>
          <p className="mt-0.5 text-[11px] text-[#999999]">
            {isPremium ? "$8 / month · cancel anytime" : "up to 25 pieces"}
          </p>
        </div>

        {isPremium ? (
          <button
            onClick={stripeEnabled ? handleManage : undefined}
            disabled={loading || !stripeEnabled}
            title={!stripeEnabled ? "Coming soon" : undefined}
            className="text-[13px] text-[#2D5A45] transition-opacity hover:opacity-70 disabled:opacity-30"
          >
            {loading ? "loading…" : "manage"}
          </button>
        ) : (
          <Link href="/upgrade" className="text-[13px] font-medium text-[#2D5A45] transition-opacity hover:opacity-70">
            upgrade →
          </Link>
        )}
      </div>

      {error && <p className="mt-2 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}
