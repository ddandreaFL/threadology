"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { safeNext } from "@/lib/next-path";
import { AuthForm, FormField, SubmitButton } from "@/components/auth/auth-form";

function LoginForm() {
  const router = useRouter();
  // A visitor sent here from a share link comes back to that link, with the
  // save they were trying to make still attached.
  const params = useSearchParams();
  const next = safeNext(params.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // A confirmation link that failed lands here with ?error=; say so, rather
  // than showing a plain form as if nothing had happened.
  const [error, setError] = useState(
    params.get("error") === "confirmation_failed"
      ? "That confirmation link didn't work — it may have expired or already been used. Try logging in; if your email isn't confirmed yet, sign up again to get a new link."
      : ""
  );
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(
        authError.message === "Invalid login credentials"
          ? "Incorrect email or password."
          : authError.message
      );
      setIsLoading(false);
      return;
    }

    router.push(next);
  }

  return (
    <AuthForm title="welcome back">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          autoComplete="current-password"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <SubmitButton label="log in →" loadingLabel="logging in…" isLoading={isLoading} />
      </form>

      <p className="mt-6 text-center text-[13px] text-[#999999]">
        don&apos;t have an account?{" "}
        <Link href={next === "/vault" ? "/signup" : `/signup?next=${encodeURIComponent(next)}`} className="text-[#111111] underline">
          sign up
        </Link>
      </p>
    </AuthForm>
  );
}

/**
 * useSearchParams needs a boundary or the whole route opts out of static
 * rendering at build time.
 */
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
