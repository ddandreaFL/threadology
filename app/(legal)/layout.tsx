import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-10">
          <Link
            href="/"
            className="text-[13px] text-[#999999] transition-colors hover:text-[#111111]"
          >
            ← threadology
          </Link>
        </div>

        <article>{children}</article>

        <footer className="mt-16 flex gap-6 border-t border-[#EBEBEB] pt-8">
          <Link href="/privacy" className="text-[12px] text-[#999999] transition-colors hover:text-[#111111]">
            privacy
          </Link>
          <Link href="/terms" className="text-[12px] text-[#999999] transition-colors hover:text-[#111111]">
            terms
          </Link>
          <Link href="/security" className="text-[12px] text-[#999999] transition-colors hover:text-[#111111]">
            security
          </Link>
        </footer>
      </div>
    </div>
  );
}
