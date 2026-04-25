"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AuthForm, FormField, SubmitButton } from "@/components/auth/auth-form";

interface FieldErrors {
  username?: string;
  email?: string;
  password?: string;
}

export default function SignupPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!username.trim()) {
      errors.username = "Username is required.";
    } else if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      errors.username = "3–30 characters, letters, numbers, and underscores only.";
    }
    if (!email.trim()) {
      errors.email = "Email is required.";
    }
    if (password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;
    setIsLoading(true);

    // Check if username is already taken before creating the auth user
    const { data: existing } = await supabase
      .from("users")
      .select("username")
      .eq("username", username.trim())
      .maybeSingle();

    if (existing) {
      setFieldErrors({ username: "Username is already taken." });
      setIsLoading(false);
      return;
    }

    // Sign up — the handle_new_user trigger will create the users row.
    // We pass username in metadata so the trigger uses it directly.
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username.trim() },
      },
    });

    if (authError) {
      if (authError.message.toLowerCase().includes("password")) {
        setFieldErrors({ password: authError.message });
      } else if (authError.message.toLowerCase().includes("email")) {
        setFieldErrors({ email: "An account with this email already exists." });
      } else {
        setFormError(authError.message);
      }
      setIsLoading(false);
      return;
    }

    // Supabase returns a user with empty identities if the email is already registered
    if (data.user && data.user.identities?.length === 0) {
      setFieldErrors({ email: "An account with this email already exists." });
      setIsLoading(false);
      return;
    }

    // If email confirmation is required, the trigger fires on confirmation.
    // If auto-confirm is on, update the username row now in case the trigger
    // used the email prefix instead of metadata.
    if (data.user) {
      await supabase
        .from("users")
        .update({ username: username.trim() })
        .eq("id", data.user.id);
    }

    router.push("/vault");
  }

  return (
    <AuthForm title="create your account">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField
          id="username"
          label="Username"
          value={username}
          onChange={setUsername}
          placeholder="yourhandle"
          autoComplete="username"
          error={fieldErrors.username}
        />
        <FormField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
          error={fieldErrors.email}
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          autoComplete="new-password"
          error={fieldErrors.password}
        />

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <SubmitButton
          label="create account →"
          loadingLabel="creating account…"
          isLoading={isLoading}
        />
      </form>

      <p className="mt-6 text-center text-[13px] text-[#999999]">
        already have an account?{" "}
        <Link href="/login" className="text-[#111111] underline">
          log in
        </Link>
      </p>
    </AuthForm>
  );
}
