"use client";

interface AuthFormProps {
  title: string;
  children: React.ReactNode;
}

export function AuthForm({ title, children }: AuthFormProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-[22px] font-medium tracking-[-0.02em] text-[#111111]">
          {title}
        </h1>
        {children}
      </div>
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
}

export function FormField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
}: FormFieldProps) {
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
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full border-b border-[#E8E8E8] bg-transparent pb-2 pt-1 text-[15px] text-[#111111] outline-none placeholder:text-[#C8C8C8] transition-colors focus:border-[#111111]"
      />
      {error && <p className="text-[12px] text-red-500">{error}</p>}
    </div>
  );
}

interface SubmitButtonProps {
  label: string;
  loadingLabel: string;
  isLoading: boolean;
}

export function SubmitButton({ label, loadingLabel, isLoading }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className="w-full rounded-[30px] bg-[#1A1A1A] py-[17px] text-[15px] font-medium text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isLoading ? loadingLabel : label}
    </button>
  );
}
