export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 h-4 w-24 animate-pulse rounded bg-white" />
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-2xl bg-white" />
        <div className="flex flex-col gap-4 pt-2">
          <div className="h-3 w-20 animate-pulse rounded bg-white" />
          <div className="h-7 w-48 animate-pulse rounded bg-white" />
          <div className="h-3 w-32 animate-pulse rounded bg-white" />
          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-[#E0D8CC] pt-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-2 w-12 animate-pulse rounded bg-white" />
                <div className="h-3 w-20 animate-pulse rounded bg-white" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
