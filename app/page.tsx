import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { APP_STORE_URL } from "@/lib/app-store";
import { LegalLinks } from "@/components/auth/auth-form";

/**
 * The front door — the app's welcome screen (threadology-native/app/(auth)/
 * welcome.tsx): the wordmark, the line, the mark, and the ways in. The app
 * comes first; the web is the second way in. Signed in, straight to the
 * vault.
 */
export default async function Home() {
  const user = await getUser();
  if (user) redirect("/vault");

  return (
    <main className="flex min-h-dvh flex-col bg-white font-th-sans text-th-ink">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-between px-7 pb-6 pt-[calc(env(safe-area-inset-top)+56px)] lg:justify-center lg:gap-16 lg:pt-0">
        <div className="flex flex-col gap-2.5">
          <h1 className="text-[42px] font-semibold leading-[46px] tracking-[-0.025em]">Threadology</h1>
          <p className="text-[16px] tracking-[-0.01em] text-[#999999]">your wardrobe, documented.</p>
        </div>

        <p className="text-[72px] leading-[72px] text-[#EBEBEB]" aria-hidden>
          ✦
        </p>

        <div className="flex flex-col gap-3">
          <a href={APP_STORE_URL} className="rounded-[30px] bg-th-accent py-[17px] text-center text-[15px] font-medium text-white transition-opacity hover:opacity-85">
            get the iPhone app
          </a>
          <Link href="/signup" className="rounded-[30px] border border-[#EBEBEB] py-[17px] text-center text-[15px] font-medium transition-colors hover:border-[#1A1A1A]">
            create account with email
          </Link>
          <Link href="/login" className="py-3 text-center text-[14px] text-[#999999] hover:text-th-ink">
            already have an account? <span className="text-th-ink">log in</span>
          </Link>
          <LegalLinks className="pt-4" />
        </div>
      </div>
    </main>
  );
}
