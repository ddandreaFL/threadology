export default function Loading() {
  return (
    <div className="mx-auto max-w-lg pb-24">
      <div className="h-8 w-36 animate-pulse rounded bg-white" />
      <div className="mt-1 h-3 w-20 animate-pulse rounded bg-white" />
      <div className="mt-6 space-y-3">
        <div className="h-11 w-full animate-pulse rounded-xl bg-white" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between rounded-xl border border-[#E0D8CC] bg-white px-4 py-3">
            <div className="space-y-1.5">
              <div className="h-3.5 w-32 animate-pulse rounded bg-white" />
              <div className="h-2.5 w-20 animate-pulse rounded bg-white" />
            </div>
            <div className="h-3 w-10 animate-pulse rounded bg-white" />
          </div>
        ))}
      </div>
    </div>
  );
}
