import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";

/**
 * The front door. It was the stock template — a default heading and two
 * default buttons — the one page on the site in nobody's design language.
 * Signed in, it is only in the way: straight to the vault.
 */
export default async function Home() {
  const user = await getUser();
  if (user) redirect("/vault");

  return (
    <main className="flex min-h-[100dvh] flex-col bg-white px-6">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#999999]">threadology</p>
        <h1 className="mt-4 text-[34px] font-medium leading-[1.1] tracking-[-0.03em] text-[#111111]">
          An archive for the clothes you keep.
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-[#6B6358]">
          Photograph each piece, give it a story, group it into collections, and log what you wear. Share any of it
          by link — only the people you send it to can see it.
        </p>

        <div className="mt-10 flex flex-col gap-3">
          <Link
            href="/signup"
            className="rounded-[30px] bg-[#1A1A1A] py-3.5 text-center text-[15px] font-medium text-white transition-opacity hover:opacity-80"
          >
            start your vault →
          </Link>
          <Link
            href="/login"
            className="rounded-[30px] border border-[#E8E5DE] py-3.5 text-center text-[15px] text-[#111111] transition-colors hover:border-[#1A1A1A]"
          >
            log in
          </Link>
        </div>
      </div>

      <footer className="mx-auto flex w-full max-w-sm justify-between py-6 text-[12px] text-[#999999]">
        <Link href="/privacy" className="hover:text-[#111111]">privacy</Link>
        <Link href="/terms" className="hover:text-[#111111]">terms</Link>
        <Link href="/security" className="hover:text-[#111111]">security</Link>
      </footer>
    </main>
  );
}
