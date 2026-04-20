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
    <div className="mt-8 rounded-2xl border border-[#E0D8CC] bg-[#FDFCFA] p-6">
      <p className="mb-5 font-mono-display text-[10px] uppercase tracking-widest text-gray-400">
        Billing
      </p>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-800">
            {isPremium ? "Premium plan" : "Free plan"}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">
            {isPremium ? "$8 / month · cancel anytime" : "Up to 25 pieces"}
          </p>
        </div>

        {isPremium ? (
          <button
            onClick={stripeEnabled ? handleManage : undefined}
            disabled={loading || !stripeEnabled}
            title={!stripeEnabled ? "Subscription management coming soon" : undefined}
            className="rounded-full border border-[#E0D8CC] bg-white px-4 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Loading..." : "Manage subscription"}
          </button>
        ) : (
          <Link
            href="/upgrade"
            className="rounded-full bg-[#2D5A45] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#1E3D2F]"
          >
            Upgrade
          </Link>
        )}
      </div>

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
    </div>
  );
}
