import Link from "next/link";

export function EmptyVault() {
  return (
    <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-[#EBEBEB] py-24 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F5F5]">
        <svg className="h-7 w-7 text-[#CCCCCC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25}
            d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
        </svg>
      </div>

      <p className="text-[17px] font-medium tracking-[-0.01em] text-[#111111]">your vault awaits</p>
      <p className="mt-1.5 text-[13px] text-[#999999]">start documenting your wardrobe</p>

      <Link
        href="/vault/add"
        className="mt-7 rounded-[30px] bg-[#1A1A1A] px-6 py-3 text-[14px] font-medium text-white transition-opacity hover:opacity-80"
      >
        add your first piece →
      </Link>
    </div>
  );
}
