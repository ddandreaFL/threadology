import Link from "next/link";
import { FREE_PIECE_LIMIT } from "@/lib/subscription";

interface UpgradePromptProps {
  currentCount: number;
}

const BENEFITS = [
  "Unlimited pieces",
  "Collection valuation dashboard",
  "AI tag identification (coming soon)",
  "PDF export (coming soon)",
  "Priority support",
];

export function UpgradePrompt({ currentCount }: UpgradePromptProps) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/40 px-8 py-10 text-center">
      {/* Icon */}
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
        <svg
          className="h-6 w-6 text-amber-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>

      <h2 className="text-lg text-gray-900">You&apos;ve reached your free limit</h2>
      <p className="mt-2 text-sm text-gray-500">
        You have {currentCount} pieces documented &mdash; the free plan limit is{" "}
        {FREE_PIECE_LIMIT}.
      </p>

      {/* Benefits */}
      <ul className="mx-auto mt-7 max-w-xs space-y-2.5 text-left">
        {BENEFITS.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2.5">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-[#2D5A45]"
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
            <span className="text-sm text-gray-700">{benefit}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/upgrade"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#2D5A45] px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1E3D2F]"
      >
        Upgrade for $8/month
      </Link>

      <p className="mt-3 text-xs text-gray-400">Cancel anytime. No commitment.</p>
    </div>
  );
}
