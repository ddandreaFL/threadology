"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { addPiece } from "@/lib/actions/pieces";
import { uploadImage } from "@/lib/storage";
import { compressImage } from "@/lib/compress";

interface AddPieceFormProps {
  userId: string;
}

function StepDots({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-[5px]">
      {[1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: i <= step ? 18 : 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: i <= step ? "#111111" : "#DEDEDE",
            transition: "width 0.2s ease, background-color 0.2s ease",
          }}
        />
      ))}
    </div>
  );
}

const fieldCls =
  "w-full bg-transparent border-b border-[#E8E8E8] pb-2 pt-1 text-[15px] text-[#111111] outline-none focus:border-[#111111] placeholder:text-[#C8C8C8] transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] text-[#999999]">{label}</span>
      {children}
    </div>
  );
}

export function AddPieceForm({ userId }: AddPieceFormProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [year, setYear] = useState("");
  const [type, setType] = useState("");
  const [condition, setCondition] = useState("");
  const [story, setStory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setUploadError("");
    const preview = URL.createObjectURL(file);
    setPhotoPreview(preview);
    try {
      const compressed = await compressImage(file);
      const url = await uploadImage(compressed, userId);
      setPhotoUrl(url);
      setStep(2);
    } catch (e) {
      setPhotoPreview(null);
      setUploadError(e instanceof Error ? e.message : "upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!brand.trim()) { setError("brand is required"); return; }
    if (!type.trim()) { setError("type is required"); return; }

    setSubmitting(true);
    const result = await addPiece({
      brand: brand.trim(),
      type: type.trim(),
      name: name.trim() || null,
      year: year.trim() || null,
      season: null,
      size: null,
      condition: condition.trim() || null,
      story: story.trim() || null,
      estimated_value: null,
      acquisition_method: null,
      photos: photoUrl ? [photoUrl] : [],
      crop_positions: null,
    });

    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
    }
  }

  /* ── Step 1: Photo ── */
  if (step === 1) {
    return (
      <div className="flex flex-col">
        {/* Nav row */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/vault"
            className="flex items-center gap-1.5 text-[13px] text-[#999999] transition-colors hover:text-[#111111]"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            cancel
          </Link>
          <StepDots step={1} />
        </div>

        {/* Title */}
        <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-[#111111] mb-1">add a piece</h1>
        <p className="text-[13px] text-[#999999] mb-7">start with a photo</p>

        {/* Upload cards */}
        <div className="flex flex-col gap-3">
          {/* Camera */}
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            disabled={uploading}
            className="flex flex-col items-center justify-center gap-3 rounded-[16px] border border-dashed border-[#DEDEDE] bg-white py-12 transition-colors hover:border-[#999999] disabled:opacity-50"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1A1A1A]">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-[15px] font-semibold text-[#111111]">take a photo</p>
              <p className="text-[12px] text-[#999999]">use your camera</p>
            </div>
          </button>

          {/* Library */}
          <button
            type="button"
            onClick={() => libraryRef.current?.click()}
            disabled={uploading}
            className="flex flex-col items-center justify-center gap-3 rounded-[16px] border border-[#EBEBEB] bg-white py-12 transition-colors hover:border-[#999999] disabled:opacity-50"
          >
            <svg className="h-8 w-8 text-[#AAAAAA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={1.5} strokeLinecap="round" />
              <circle cx="8.5" cy="8.5" r="1.5" strokeWidth={1.5} />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m21 15-5-5L5 21" />
            </svg>
            <div className="text-center">
              <p className="text-[15px] font-semibold text-[#111111]">choose from library</p>
              <p className="text-[12px] text-[#999999]">photos or files</p>
            </div>
          </button>
        </div>

        {uploading && (
          <div className="mt-5 flex items-center justify-center gap-2 text-[12px] text-[#999999]">
            <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            uploading…
          </div>
        )}
        {uploadError && <p className="mt-4 text-center text-[12px] text-red-500">{uploadError}</p>}

        <p className="mt-8 text-center text-[11px] text-[#BBBBBB]">your photos are private by default</p>

        {/* Hidden file inputs */}
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleInputChange} className="hidden" />
        <input ref={libraryRef} type="file" accept="image/*" onChange={handleInputChange} className="hidden" />
      </div>
    );
  }

  /* ── Step 2: Details ── */
  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      {/* Nav row */}
      <div className="flex items-center justify-between mb-7">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="flex items-center gap-1.5 text-[13px] text-[#999999] transition-colors hover:text-[#111111]"
        >
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          back
        </button>
        <StepDots step={2} />
      </div>

      {/* Photo thumb + heading */}
      <div className="flex items-center gap-4 mb-8">
        {(photoPreview || photoUrl) && (
          <div className="relative h-[60px] w-[44px] flex-shrink-0 overflow-hidden rounded-[8px] bg-[#F5F5F5]">
            <Image
              src={photoPreview ?? photoUrl!}
              alt="piece"
              fill
              sizes="44px"
              className="object-cover"
            />
          </div>
        )}
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#111111]">the details</h1>
          <p className="text-[12px] text-[#999999]">tell us about this piece</p>
        </div>
      </div>

      {/* Form fields */}
      <div className="flex flex-col gap-6 pb-28">
        <Field label="name">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="asymmetric wool coat"
            className={fieldCls}
          />
        </Field>

        <Field label="brand">
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="comme des garçons"
            className={fieldCls}
          />
        </Field>

        <div className="grid grid-cols-2 gap-6">
          <Field label="year">
            <input
              type="text"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="1994"
              className={fieldCls}
            />
          </Field>
          <Field label="type">
            <input
              type="text"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="outerwear"
              className={fieldCls}
            />
          </Field>
        </div>

        <Field label="condition">
          <input
            type="text"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            placeholder="excellent"
            className={fieldCls}
          />
        </Field>

        <Field label="story">
          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="where did you find it? what does it mean to you?"
            rows={3}
            className={`${fieldCls} resize-none`}
          />
        </Field>

        {error && <p className="text-[12px] text-red-500">{error}</p>}
      </div>

      {/* Save button — fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white px-4 pb-8 pt-3">
        <div className="mx-auto max-w-2xl">
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center rounded-[30px] bg-[#1A1A1A] py-[17px] text-[15px] font-medium text-white transition-opacity disabled:opacity-60"
          >
            {submitting ? "saving…" : "save to vault →"}
          </button>
        </div>
      </div>
    </form>
  );
}
