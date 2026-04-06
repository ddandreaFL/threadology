import Link from "next/link";

interface PieceLimitBannerProps {
  count: number;
  limit: number;
}

export function PieceLimitBanner({ count, limit }: PieceLimitBannerProps) {
  const pct = Math.min(100, Math.round((count / limit) * 100));
  const atLimit = count >= limit;
  const nearLimit = count >= limit - 5;

  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        atLimit
          ? "border-amber-200 bg-amber-50"
          : nearLimit
          ? "border-amber-100 bg-amber-50/60"
          : "border-[#E0D8CC] bg-[#FDFCFA]"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono-display text-xs uppercase tracking-widest text-gray-500">
            {count} of {limit} pieces
          </span>
          {atLimit && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 font-mono-display text-[10px] uppercase tracking-widest text-amber-700">
              Limit reached
            </span>
          )}
        </div>
        <Link
          href="/upgrade"
          className="shrink-0 text-xs font-medium text-[#2D5A45] transition-colors hover:text-[#1E3D2F]"
        >
          Upgrade →
        </Link>
      </div>

      {/* Progress bar */}
      <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-[#E0D8CC]">
        <div
          className={`h-full rounded-full transition-all ${
            atLimit ? "bg-amber-400" : "bg-[#2D5A45]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
