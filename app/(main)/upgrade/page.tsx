"use client";

import { useState } from "react";
import Link from "next/link";

const BENEFITS = [
  {
    title: "Unlimited pieces",
    description: "Document your entire wardrobe with no ceiling.",
  },
  {
    title: "Collection valuation",
    description: "Track the estimated value of your archive over time.",
  },
  {
    title: "AI tag identification",
    description: "Identify pieces from photos automatically. (Coming soon)",
  },
  {
    title: "PDF export",
    description:
      "Export your vault as a formatted lookbook or inventory. (Coming soon)",
  },
  {
    title: "Priority support",
    description: "Get help faster when you need it.",
  },
];

export default function UpgradePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Something went wrong");
        setLoading(false);
      }
    } catch {
      setError("Failed to start checkout");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      {/* Header */}
      <div className="text-center">
        <p className="font-mono-display text-xs uppercase tracking-widest text-[#2D5A45]">
          Threadology Premium
        </p>
        <h1 className="mt-3 font-serif text-3xl text-gray-900">
          Upgrade your archive
        </h1>
        <p className="mt-3 text-sm text-gray-500">
          Unlock unlimited pieces and all features for $8/month.
        </p>
      </div>

      {/* Benefits */}
      <div className="mt-10 space-y-4">
        {BENEFITS.map((b) => (
          <div
            key={b.title}
            className="flex gap-3 rounded-xl border border-[#E0D8CC] bg-[#FDFCFA] px-4 py-4"
          >
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2D5A45]/10">
              <svg
                className="h-3 w-3 text-[#2D5A45]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{b.title}</p>
              <p className="mt-0.5 text-xs text-gray-400">{b.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-8 rounded-2xl border border-[#2D5A45]/20 bg-[#2D5A45]/5 p-6 text-center">
        <p className="text-2xl font-semibold text-gray-900">$8</p>
        <p className="text-sm text-gray-400">per month · cancel anytime</p>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="mt-5 w-full rounded-full bg-[#2D5A45] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1E3D2F] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Loading..." : "Subscribe Now"}
        </button>

        <p className="mt-3 text-xs text-gray-400">
          Secure payment via Stripe. Cancel anytime.
        </p>
      </div>

      <div className="mt-4 text-center">
        <Link href="/vault" className="text-sm text-gray-400 hover:text-gray-600">
          Back to vault
        </Link>
      </div>
    </div>
  );
}
