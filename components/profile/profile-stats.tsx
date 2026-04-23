interface ProfileStatsProps {
  pieceCount: number;
  brandCount: number;
  eraSpan: string | null;
}

export function ProfileStats({ pieceCount, brandCount, eraSpan }: ProfileStatsProps) {
  return (
    <div className="mt-5 grid grid-cols-3 divide-x divide-[#EBEBEB] border-y border-[#EBEBEB]">
      {[
        { value: String(pieceCount), label: "pieces" },
        { value: String(brandCount), label: "brands" },
        { value: eraSpan ?? "—", label: "era span" },
      ].map(({ value, label }) => (
        <div key={label} className="py-4 text-center">
          <p className="text-[18px] font-semibold tabular-nums text-[#111111]">{value}</p>
          <p className="mt-0.5 text-[10px] text-[#999999]">{label}</p>
        </div>
      ))}
    </div>
  );
}
