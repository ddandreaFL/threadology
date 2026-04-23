export default function Loading() {
  return (
    <div className="pb-24">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-[#E0D8CC] bg-[#FDFCFA]">
            <div className="aspect-square animate-pulse bg-gray-100" />
            <div className="px-3 pb-3 pt-2.5 space-y-1.5">
              <div className="h-2 w-16 animate-pulse rounded bg-white" />
              <div className="h-3 w-24 animate-pulse rounded bg-white" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
