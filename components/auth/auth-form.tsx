"use client";

interface AuthFormProps {
  title: string;
  children: React.ReactNode;
}

export function AuthForm({ title, children }: AuthFormProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F1EA] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#E0D8CC] bg-white px-8 py-10 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-semibold tracking-tight text-gray-900">
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
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="rounded-lg border border-[#E0D8CC] bg-[#FDFCFA] px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-[#2D5A45] focus:ring-2 focus:ring-[#2D5A45]/20"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
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
      className="w-full rounded-lg bg-[#2D5A45] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1E3D2F] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isLoading ? loadingLabel : label}
    </button>
  );
}
