"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AuthForm, FormField, SubmitButton } from "@/components/auth/auth-form";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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

    router.push("/vault");
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
        <Link href="/signup" className="text-[#111111] underline">
          sign up
        </Link>
      </p>
    </AuthForm>
  );
}
