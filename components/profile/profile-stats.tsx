interface ProfileStatsProps {
  pieceCount: number;
  brandCount: number;
  eraSpan: string | null;
  topBrands: string[];
}

export function ProfileStats({
  pieceCount,
  brandCount,
  eraSpan,
  topBrands,
}: ProfileStatsProps) {
  return (
    <div className="mb-8">
      <div className="grid grid-cols-3 divide-x divide-[#E0D8CC] border-y border-[#E0D8CC]">
        {[
          { value: String(pieceCount), label: "Pieces" },
          { value: String(brandCount), label: "Brands" },
          { value: eraSpan ?? "—", label: "Era Span" },
        ].map(({ value, label }) => (
          <div key={label} className="py-4 text-center">
            <p className="text-2xl font-semibold tabular-nums text-gray-900">
              {value}
            </p>
            <p className="mt-0.5 font-mono-display text-[10px] uppercase tracking-widest text-gray-400">
              {label}
            </p>
          </div>
        ))}
      </div>

      {topBrands.length >= 2 && (
        <div className="mt-5">
          <p className="mb-2 font-mono-display text-[10px] uppercase tracking-widest text-gray-400">
            Top Brands
          </p>
          <div className="flex flex-wrap gap-2">
            {topBrands.map((brand) => (
              <span
                key={brand}
                className="rounded-full border border-[#E0D8CC] px-3 py-1 font-mono-display text-[10px] uppercase tracking-widest text-[#2C2C2C]"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
