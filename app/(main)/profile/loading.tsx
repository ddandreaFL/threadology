/**
 * One skeleton for the one call (the handoff's loading state). The header is
 * drawn by the page, so this is the body only.
 */
export default function ProfileLoading() {
  const block = "bg-th-surface";
  const list = (
    <div>
      <div className={`${block} h-3 w-[110px]`} />
      <div className="mt-3 border-t border-th-border">
        {[88, 72, 64, 52, 44].map((w) => (
          <div key={w} className="border-b border-th-border py-3.5">
            <div className={`${block} h-3.5`} style={{ width: `${w}%` }} />
            <div className={`${block} mt-2.5 h-1`} />
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div aria-busy className="flex flex-col gap-7 px-5 pt-[88px] lg:mx-auto lg:max-w-xl lg:pt-10">
      <div className="flex items-center gap-4">
        <div className={`${block} h-[72px] w-[72px] rounded-full`} />
        <div className="flex flex-col gap-2.5">
          <div className={`${block} h-[18px] w-[120px]`} />
          <div className={`${block} h-3 w-[150px]`} />
        </div>
      </div>
      <div className={`${block} -mt-3 h-3.5 w-4/5`} />
      <div className={`${block} h-[76px] rounded-th-chip`} />
      {list}
      {list}
    </div>
  );
}
