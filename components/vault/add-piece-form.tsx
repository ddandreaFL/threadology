"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PhotoUploadWithCrop } from "@/components/vault/photo-upload-with-crop";
import { BrandInput } from "@/components/vault/brand-input";

const PIECE_TYPES = [
  "jacket", "coat", "hoodie", "sweatshirt", "shirt", "t-shirt", "polo",
  "sweater", "vest", "pants", "jeans", "shorts", "shoes", "sneakers",
  "boots", "sandals", "bag", "hat", "accessory", "other",
] as const;

const CONDITIONS = ["deadstock", "excellent", "good", "fair", "worn"] as const;

const ACQUISITION_METHODS = [
  { value: "online", label: "Online" },
  { value: "in_person", label: "In Person" },
  { value: "thrift", label: "Thrift" },
  { value: "gift", label: "Gift" },
  { value: "trade", label: "Trade" },
  { value: "other", label: "Other" },
] as const;

type CropPos = { x: number; y: number };

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
  acquisitionMethod: string;
  photos: string[];
  cropPositions: Record<string, CropPos>;
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
  acquisitionMethod: "",
  photos: [],
  cropPositions: {},
};

interface AddPieceFormProps {
  userId: string;
  frequentBrands: string[];
}

export function AddPieceForm({ userId, frequentBrands }: AddPieceFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
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
      acquisition_method: form.acquisitionMethod || null,
      photos: form.photos,
      crop_positions: Object.keys(form.cropPositions).length > 0 ? form.cropPositions : null,
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* ── Section 1: Photos ── */}
      <section>
        <h2 className="mb-4 font-serif text-xl text-gray-900">Photos</h2>
        <PhotoUploadWithCrop
          userId={userId}
          photos={form.photos}
          cropPositions={form.cropPositions}
          onPhotosChange={(photos) => set("photos", photos)}
          onCropPositionsChange={(pos) => set("cropPositions", pos)}
          onUploadingChange={setUploading}
          maxFiles={6}
        />
      </section>

      {/* ── Section 2: Metadata ── */}
      <section className="flex flex-col gap-5">
        <h2 className="font-serif text-xl text-gray-900">Details</h2>

        {/* Brand with chips */}
        <BrandInput
          value={form.brand}
          onChange={(v) => set("brand", v)}
          frequentBrands={frequentBrands}
        />

        {/* Type */}
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

        {/* Name + Year */}
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
        </div>

        {/* Season + Size */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        </div>

        {/* Condition + Est. Value */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

        {/* Acquisition method */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">
            How did you get it?
          </label>
          <div className="flex flex-wrap gap-2">
            {ACQUISITION_METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() =>
                  set(
                    "acquisitionMethod",
                    form.acquisitionMethod === m.value ? "" : m.value
                  )
                }
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  form.acquisitionMethod === m.value
                    ? "border-[#2D5A45] bg-[#2D5A45] text-white"
                    : "border-[#E0D8CC] bg-[#FDFCFA] text-gray-600 hover:border-[#2D5A45] hover:text-[#2D5A45]"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Story */}
        <Field label="Story">
          <textarea
            value={form.story}
            onChange={(e) => set("story", e.target.value)}
            placeholder="Where did you get it? Why does it matter?"
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </Field>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isDisabled}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2D5A45] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1E3D2F] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {uploading && (
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {uploading ? "Uploading photos…" : submitting ? "Saving…" : "Add to vault"}
      </button>
    </form>
  );
}

const inputCls =
  "w-full rounded-lg border border-[#E0D8CC] bg-[#FDFCFA] px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-[#2D5A45] focus:ring-2 focus:ring-[#2D5A45]/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}
