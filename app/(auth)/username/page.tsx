"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { safeNext } from "@/lib/next-path";
import { AuthForm, FormField, SubmitButton } from "@/components/auth/auth-form";

/**
 * Choose a username — the app's (auth)/username screen, for an account
 * made with Apple. Starts from the name the account was given, so someone
 * who already chose one in the app just confirms it.
 */
function UsernameForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [userId, setUserId] = useState<string | null>(null);
  const [current, setCurrent] = useState("");
  const [username, setUsername] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return router.replace("/login");
      setUserId(data.user.id);
      const { data: row } = await supabase.from("users").select("username").eq("id", data.user.id).single();
      const name = row?.username ?? "";
      setCurrent(name);
      // A private-relay prefix is no one's name; offer a blank field instead.
      if (/^[a-z0-9_]{3,30}$/.test(name) && !/^[a-z0-9]{10}$/.test(name)) {
        setUsername(name);
        setAvailable(true);
      }
    })();
  }, [router]);

  async function check(value: string) {
    if (value.length < 3) return setAvailable(null);
    if (value === current) return setAvailable(true);
    setChecking(true);
    const { data } = await supabase.from("users").select("id").eq("username", value).maybeSingle();
    setChecking(false);
    setAvailable(data === null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || username.length < 3 || available === false) return;
    setSaving(true);
    setError("");
    if (username !== current) {
      // Not yet checked (the field never lost focus): check now.
      const { data: taken } = await supabase.from("users").select("id").eq("username", username).maybeSingle();
      if (taken) {
        setSaving(false);
        return setAvailable(false);
      }
      const { error } = await supabase.from("users").update({ username }).eq("id", userId);
      if (error) {
        setSaving(false);
        return setError(error.code === "23505" ? "That username was just taken." : error.message);
      }
    }
    await supabase.auth.updateUser({ data: { username_chosen: true } });
    router.replace(next);
    router.refresh();
  }

  const hint = checking
    ? "checking…"
    : available === true
      ? "✓ available"
      : available === false
        ? undefined
        : username.length > 0 && username.length < 3
          ? "at least 3 characters"
          : "letters, numbers and underscores";

  return (
    <AuthForm title="choose a username" subtitle="it's how your vault is found" back={null}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <FormField
          id="username"
          label="username"
          value={username}
          onChange={(v) => {
            setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30));
            setAvailable(null);
          }}
          onBlur={() => check(username)}
          placeholder="yourhandle"
          autoComplete="username"
          hint={hint}
          error={available === false ? "taken — try another" : error || undefined}
        />
        <SubmitButton label="continue →" loadingLabel="saving…" isLoading={saving} disabled={username.length < 3 || available === false} />
      </form>
    </AuthForm>
  );
}

export default function UsernamePage() {
  return (
    <Suspense>
      <UsernameForm />
    </Suspense>
  );
}
