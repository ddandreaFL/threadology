"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PhotoUpload } from "@/components/vault/photo-upload";
import { PieceSlot } from "@/components/fit/piece-slot";
import { PieceSelector } from "@/components/fit/piece-selector";
import { createFit } from "@/lib/actions/fits";
import type { FitPiece } from "@/components/fit/piece-slot";

interface FitFormProps {
  userId: string;
  username: string;
  pieces: FitPiece[];
}

function generateSlug(title: string, date: string): string {
  const base = title.trim()
    ? title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/-$/, "")
        .slice(0, 50)
    : "";
  return base || `fit-${date}`;
}

export function FitForm({ userId, username, pieces }: FitFormProps) {
  const router = useRouter();

  // Form state
  const [photos, setPhotos] = useState<string[]>([]);
  const [slots, setSlots] = useState<(FitPiece | null)[]>([null, null, null, null]);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [date, setDate] = useState(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  });
  const [location, setLocation] = useState("");

  // UI state
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectorSlot, setSelectorSlot] = useState<number | null>(null);

  // Drag-to-reorder state
  const dragFromIdx = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Derived
  const filledPieces = slots.filter((s): s is FitPiece => s !== null);
  const selectedIds = new Set(filledPieces.map((p) => p.id));
  const slug = generateSlug(title, date);
  const canSubmit = photos.length >= 1 && filledPieces.length >= 1 && !uploading && !submitting;

  // --- Slot management ---
  function handleSelectPiece(slotIdx: number, piece: FitPiece) {
    setSlots((prev) => {
      const next = [...prev];
      next[slotIdx] = piece;
      return next;
    });
    setSelectorSlot(null);
  }

  function handleRemovePiece(slotIdx: number) {
    setSlots((prev) => {
      const next = [...prev];
      next[slotIdx] = null;
      return next;
    });
  }

  function handleAddSlot() {
    setSlots((prev) => [...prev, null]);
  }

  // --- Drag reorder ---
  function handleDragStart(e: React.DragEvent, idx: number) {
    dragFromIdx.current = idx;
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIdx(idx);
  }

  function handleDrop(e: React.DragEvent, toIdx: number) {
    e.preventDefault();
    const fromIdx = dragFromIdx.current;
    if (fromIdx === null || fromIdx === toIdx) {
      setDragOverIdx(null);
      return;
    }
    setSlots((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
    setDragOverIdx(null);
  }

  function handleDragEnd() {
    dragFromIdx.current = null;
    setDragOverIdx(null);
  }

  // --- Submit ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setSubmitting(true);

    try {
      const { username: user, slug: savedSlug } = await createFit({
        photos,
        pieces: filledPieces.map((p, i) => ({ id: p.id, layer_order: i })),
        title: title.trim() || null,
        caption: caption.trim() || null,
        date,
        location: location.trim() || null,
        slug,
      });
      router.push(`/fit/${user}/${savedSlug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish fit.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-10">

        {/* ── Photos ── */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="font-serif text-xl text-gray-900">Photos</h2>
            <p className="mt-0.5 text-sm text-gray-400">Up to 3 photos of the fit</p>
          </div>
          <PhotoUpload
            userId={userId}
            value={photos}
            onChange={setPhotos}
            onUploadingChange={setUploading}
            maxFiles={3}
          />
        </section>

        <div className="h-px bg-[#E0D8CC]" />

        {/* ── Pieces ── */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="font-serif text-xl text-gray-900">What are you wearing?</h2>
            <p className="mt-0.5 text-sm text-gray-400">Drag to reorder — top to bottom sets layer order</p>
          </div>

          <div className="flex flex-col gap-2">
            {slots.map((piece, idx) => (
              <PieceSlot
                key={idx}
                piece={piece}
                onSelect={() => setSelectorSlot(idx)}
                onRemove={() => handleRemovePiece(idx)}
                isDragOver={dragOverIdx === idx}
                draggable={piece !== null}
                onDragStart={piece ? (e) => handleDragStart(e, idx) : undefined}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddSlot}
            className="flex items-center gap-1.5 self-start rounded-md px-2 py-1.5 text-sm text-gray-400 transition-colors hover:bg-[#F5F1EA] hover:text-gray-600"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add another piece
          </button>
        </section>

        <div className="h-px bg-[#E0D8CC]" />

        {/* ── Details ── */}
        <section className="flex flex-col gap-4">
          <h2 className="font-serif text-xl text-gray-900">Details</h2>

          <div className="flex flex-col gap-4">
            <Field label="Title">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give this fit a name"
                className={inputCls}
              />
            </Field>

            <Field label="Caption">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="What's the story?"
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Date">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputCls}
                />
              </Field>

              <Field label="Location">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Tokyo, Lower East Side"
                  className={inputCls}
                />
              </Field>
            </div>
          </div>
        </section>

        <div className="h-px bg-[#E0D8CC]" />

        {/* ── Preview URL ── */}
        <section className="flex flex-col gap-2">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-mono-display">Your fit will be live at</p>
          <p className="break-all rounded-lg border border-[#E0D8CC] bg-[#F5F1EA] px-3 py-2 font-mono-display text-xs text-gray-500">
            threadology.vercel.app/fit/{username}/{slug}
          </p>
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2D5A45] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1E3D2F] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Publishing…
            </>
          ) : (
            "Publish Fit"
          )}
        </button>

        {!canSubmit && !submitting && (
          <p className="text-center text-xs text-gray-400">
            {photos.length === 0 && filledPieces.length === 0
              ? "Add at least 1 photo and 1 piece to publish"
              : photos.length === 0
              ? "Add at least 1 photo to publish"
              : "Add at least 1 piece to publish"}
          </p>
        )}
      </form>

      {/* Piece selector modal */}
      {selectorSlot !== null && (
        <PieceSelector
          pieces={pieces}
          selectedIds={selectedIds}
          onSelect={(piece) => handleSelectPiece(selectorSlot, piece)}
          onClose={() => setSelectorSlot(null)}
        />
      )}
    </>
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
