"use client";

import Link from "next/link";
import { useState } from "react";
import { ChipButton } from "@/components/ui/ChipButton";
import { supabase } from "@/lib/supabase";

/**
 * The auth screens, as in the app (threadology-native/app/(auth)): a white
 * page, a lowercase title, underlined fields and the ink pill. On a desktop
 * the same column sits centered.
 */
export function AuthForm({
  title,
  subtitle,
  back = "/",
  children,
}: {
  title: string;
  subtitle?: string;
  /** Where the back chip goes; null for none. */
  back?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-white font-th-sans text-th-ink">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col px-7 pb-6 pt-[calc(env(safe-area-inset-top)+16px)] lg:justify-center lg:pt-0">
        {back && (
          <div className="mb-8 lg:mb-10">
            <ChipButton icon="chevron-left" label="back" href={back} />
          </div>
        )}
        <h1 className="text-[28px] font-bold leading-8 tracking-[-0.02em]">{title}</h1>
        {subtitle && <p className="mt-2 text-[15px] text-[#999999]">{subtitle}</p>}
        <div className="mt-9">{children}</div>
        <LegalLinks className="mt-auto pt-12 lg:mt-12" />
      </div>
    </div>
  );
}

export function LegalLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`flex justify-center gap-5 ${className}`}>
      <Link href="/privacy" className="text-[11px] text-[#BBBBBB] transition-colors hover:text-[#999999]">privacy</Link>
      <Link href="/terms" className="text-[11px] text-[#BBBBBB] transition-colors hover:text-[#999999]">terms</Link>
      <Link href="/security" className="text-[11px] text-[#BBBBBB] transition-colors hover:text-[#999999]">security</Link>
    </div>
  );
}

interface FormFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  hint?: string;
  onBlur?: () => void;
}

export function FormField({ id, label, type = "text", value, onChange, placeholder, autoComplete, error, hint, onBlur }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[11px] text-[#999999]">
        {label.toLowerCase()}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoCapitalize="none"
        className="w-full border-b border-[#E8E8E8] bg-transparent pb-2 pt-1 text-[16px] text-th-ink outline-none transition-colors placeholder:text-[#C8C8C8] focus:border-th-ink"
      />
      {error ? <p className="text-[12px] text-th-danger">{error}</p> : hint ? <p className="text-[12px] text-th-muted">{hint}</p> : null}
    </div>
  );
}

export function SubmitButton({ label, loadingLabel, isLoading, disabled }: { label: string; loadingLabel: string; isLoading: boolean; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={isLoading || disabled}
      className="mt-2 w-full rounded-[30px] bg-[#1A1A1A] py-[17px] text-[15px] font-medium text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isLoading ? loadingLabel : label}
    </button>
  );
}

/**
 * Continue with Apple — Supabase's OAuth flow, back through /auth/callback,
 * which sends a new Apple account to choose a username first.
 */
export function AppleButton({ next = "/vault" }: { next?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function go() {
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setError(error.message);
      setBusy(false);
    }
  }
  return (
    <div>
      <button
        type="button"
        onClick={go}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-[30px] bg-black py-[15px] text-[16px] font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-60"
      >
        <svg width="16" height="19" viewBox="0 0 814 1000" fill="currentColor" aria-hidden>
          <path d="M788 341c-6 4-108 62-108 190 0 148 130 200 134 202-1 3-21 72-69 142-43 62-88 124-156 124s-86-40-165-40c-77 0-104 41-167 41s-106-58-156-128C43 790 0 671 0 558 0 376 118 280 235 280c62 0 114 41 153 41 37 0 95-43 166-43 27 0 124 2 188 94zM554 157c29-35 50-83 50-131 0-7-1-14-2-19-48 2-104 32-138 71-27 30-52 78-52 127 0 7 1 15 2 17 3 1 8 2 13 2 43 0 97-29 127-67z" />
        </svg>
        {busy ? "opening apple…" : "continue with apple"}
      </button>
      {error && <p className="mt-2 text-center text-[12px] text-th-danger">{error}</p>}
    </div>
  );
}

export function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-3 text-[11px] text-[#BBBBBB]">
      <span className="h-px flex-1 bg-[#EFEFEF]" />
      or
      <span className="h-px flex-1 bg-[#EFEFEF]" />
    </div>
  );
}
