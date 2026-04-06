"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PhotoUpload } from "@/components/vault/photo-upload";

const PIECE_TYPES = [
  "jacket",
  "coat",
  "hoodie",
  "sweatshirt",
  "shirt",
  "t-shirt",
  "polo",
  "sweater",
  "vest",
  "pants",
  "jeans",
  "shorts",
  "shoes",
  "sneakers",
  "boots",
  "sandals",
  "bag",
  "hat",
  "accessory",
  "other",
] as const;

const CONDITIONS = ["deadstock", "excellent", "good", "fair", "worn"] as const;

interface FormState {
  brand: string;
  type: string;
  name: string;
  year: string;
  season: string;
  size: string;
  condition: string;
  story: string;
  estimatedValue: string;
  photos: string[];
}

const EMPTY: FormState = {
  brand: "",
  type: "",
  name: "",
  year: "",
  season: "",
  size: "",
  condition: "",
  story: "",
  estimatedValue: "",
  photos: [],
};

interface AddPieceFormProps {
  userId: string;
}

export function AddPieceForm({ userId }: AddPieceFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function set(field: keyof FormState, value: string | string[]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (uploading) return;

    setError("");

    if (!form.brand.trim()) { setError("Brand is required."); return; }
    if (!form.type) { setError("Type is required."); return; }

    setSubmitting(true);

    const { error: dbError } = await supabase.from("pieces").insert({
      user_id: userId,
      brand: form.brand.trim(),
      type: form.type,
      name: form.name.trim() || null,
      year: form.year.trim() || null,
      season: form.season.trim() || null,
      size: form.size.trim() || null,
      condition: form.condition || null,
      story: form.story.trim() || null,
      estimated_value: form.estimatedValue ? parseInt(form.estimatedValue, 10) : null,
      photos: form.photos,
    });

    if (dbError) {
      setError(dbError.message);
      setSubmitting(false);
      return;
    }

    router.push("/vault");
    router.refresh();
  }

  const isDisabled = submitting || uploading;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Required fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Brand *">
          <input
            type="text"
            value={form.brand}
            onChange={(e) => set("brand", e.target.value)}
            placeholder="e.g. Carhartt, Arc'teryx"
            className={inputCls}
          />
        </Field>

        <Field label="Type *">
          <select
            value={form.type}
            onChange={(e) => set("type", e.target.value)}
            className={inputCls}
          >
            <option value="">Select type…</option>
            {PIECE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Optional metadata */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Name / model">
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Detroit Jacket"
            className={inputCls}
          />
        </Field>

        <Field label="Year">
          <input
            type="text"
            value={form.year}
            onChange={(e) => set("year", e.target.value)}
            placeholder="e.g. 2019, FW20"
            className={inputCls}
          />
        </Field>

        <Field label="Season">
          <input
            type="text"
            value={form.season}
            onChange={(e) => set("season", e.target.value)}
            placeholder="e.g. SS23, all-season"
            className={inputCls}
          />
        </Field>

        <Field label="Size">
          <input
            type="text"
            value={form.size}
            onChange={(e) => set("size", e.target.value)}
            placeholder="e.g. M, 32, 10.5"
            className={inputCls}
          />
        </Field>

        <Field label="Condition">
          <select
            value={form.condition}
            onChange={(e) => set("condition", e.target.value)}
            className={inputCls}
          >
            <option value="">Select condition…</option>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Est. Value ($)">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
              $
            </span>
            <input
              type="number"
              min="0"
              value={form.estimatedValue}
              onChange={(e) => set("estimatedValue", e.target.value)}
              placeholder="0"
              className={`${inputCls} pl-7`}
            />
          </div>
        </Field>
      </div>

      <Field label="Story">
        <textarea
          value={form.story}
          onChange={(e) => set("story", e.target.value)}
          placeholder="Where did you get it? Why does it matter?"
          rows={3}
          className={`${inputCls} resize-none`}
        />
      </Field>

      {/* Photo upload */}
      <Field label="Photos">
        <PhotoUpload
          userId={userId}
          value={form.photos}
          onChange={(urls) => set("photos", urls)}
          onUploadingChange={setUploading}
        />
      </Field>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isDisabled}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2D5A45] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1E3D2F] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {uploading && (
          <svg
            className="h-4 w-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        )}
        {uploading ? "Uploading photos…" : submitting ? "Saving…" : "Add to vault"}
      </button>
    </form>
  );
}

// Shared input styles
const inputCls =
  "w-full rounded-lg border border-[#E0D8CC] bg-[#FDFCFA] px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-[#2D5A45] focus:ring-2 focus:ring-[#2D5A45]/20";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}
