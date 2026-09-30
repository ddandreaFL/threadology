"use client";

import Link from "next/link";
import { ChipButton } from "@/components/ui/ChipButton";
import { Logo } from "@/components/ui/Logo";
import { APP_STORE_URL } from "@/lib/app-store";

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
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col px-7 pb-6 pt-[calc(env(safe-area-inset-top)+1rem)] lg:justify-center lg:pt-0">
        {back && (
          <div className="mb-8 lg:mb-10">
            <ChipButton icon="chevron-left" label="back" href={back} />
          </div>
        )}
        <Logo size={56} className="mb-6" />
        <h1 className="text-[1.75rem] font-bold leading-8 tracking-[-0.02em]">{title}</h1>
        {subtitle && <p className="mt-2 text-[0.9375rem] text-[#999999]">{subtitle}</p>}
        <div className="mt-9">{children}</div>
        <LegalLinks className="mt-auto pt-12 lg:mt-12" />
      </div>
    </div>
  );
}

export function LegalLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`flex justify-center gap-5 ${className}`}>
      <Link href="/privacy" className="text-[0.6875rem] text-[#BBBBBB] transition-colors hover:text-[#999999]">privacy</Link>
      <Link href="/terms" className="text-[0.6875rem] text-[#BBBBBB] transition-colors hover:text-[#999999]">terms</Link>
      <Link href="/security" className="text-[0.6875rem] text-[#BBBBBB] transition-colors hover:text-[#999999]">security</Link>
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
      <label htmlFor={id} className="text-[0.6875rem] text-[#999999]">
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
        className="w-full border-b border-[#E8E8E8] bg-transparent pb-2 pt-1 text-[1rem] text-th-ink outline-none transition-colors placeholder:text-[#C8C8C8] focus:border-th-ink"
      />
      {error ? <p className="text-[0.75rem] text-th-danger">{error}</p> : hint ? <p className="text-[0.75rem] text-th-muted">{hint}</p> : null}
    </div>
  );
}

export function SubmitButton({ label, loadingLabel, isLoading, disabled }: { label: string; loadingLabel: string; isLoading: boolean; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={isLoading || disabled}
      className="mt-2 w-full rounded-[1.875rem] bg-[#1A1A1A] py-[1.0625rem] text-[0.9375rem] font-medium text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isLoading ? loadingLabel : label}
    </button>
  );
}

/**
 * Apple sign-in lives in the app. The web signs people up by email and
 * points anyone who'd rather use Apple to the app.
 */
export function AppHint() {
  return (
    <p className="mt-4 text-center text-[0.8125rem] text-[#999999]">
      prefer sign in with apple?{" "}
      <a href={APP_STORE_URL} className="font-medium text-th-accent">
        get the iPhone app
      </a>
    </p>
  );
}
