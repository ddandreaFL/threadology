import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

/**
 * Where a confirmation link lands. The email is opened on whatever device
 * the person reads mail on, and the account may have been made in the app
 * or on the web, so this says what happened and offers both ways on.
 */
export default function ConfirmedPage() {
  return (
    <AuthForm title="you're confirmed" back={null}>
      <p className="text-[0.875rem] leading-relaxed text-th-muted">
        Your email is verified and your vault is ready. If you signed up in the Threadology app, go back to it and sign
        in there.
      </p>
      <Link
        href="/vault"
        className="mt-6 block w-full rounded-[1.875rem] bg-[#1A1A1A] py-3 text-center text-[0.9375rem] font-medium text-white transition-opacity hover:opacity-80"
      >
        open my vault →
      </Link>
    </AuthForm>
  );
}
