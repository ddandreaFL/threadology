"use client";

import { useRef, useState } from "react";
import { uploadImage, deleteImage } from "@/lib/storage";
import { compressImage } from "@/lib/compress";

interface PhotoEntry {
  id: string;
  preview: string;    // blob URL while uploading, public URL after
  publicUrl: string | null;
  uploading: boolean;
  error: string | null;
}

interface PhotoUploadProps {
  userId: string;
  value: string[];
  onChange: (urls: string[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
  maxFiles?: number;
  variant?: "grid" | "gallery";
}

export function PhotoUpload({
  userId,
  value,
  onChange,
  onUploadingChange,
  maxFiles = 8,
  variant = "grid",
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [entries, setEntries] = useState<PhotoEntry[]>(() =>
    value.map((url) => ({
      id: url,
      preview: url,
      publicUrl: url,
      uploading: false,
      error: null,
    }))
  );

  const [selectedId, setSelectedId] = useState<string | null>(
    value.length > 0 ? value[0] : null
  );

  function syncParent(updatedEntries: PhotoEntry[]) {
    const urls = updatedEntries
      .filter((e) => e.publicUrl !== null)
      .map((e) => e.publicUrl as string);
    onChange(urls);
    const anyUploading = updatedEntries.some((e) => e.uploading);
    onUploadingChange?.(anyUploading);
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const remaining = maxFiles - entries.length;
    const batch = Array.from(files).slice(0, remaining);
    if (batch.length === 0) return;

    const newEntries: PhotoEntry[] = batch.map((file) => ({
      id: crypto.randomUUID(),
      preview: URL.createObjectURL(file),
      publicUrl: null,
      uploading: true,
      error: null,
    }));

    const next = [...entries, ...newEntries];
    setEntries(next);
    if (variant === "gallery") setSelectedId(newEntries[0].id);
    onUploadingChange?.(true);

    await Promise.all(
      newEntries.map(async (entry, i) => {
        try {
          const compressed = await compressImage(batch[i]);
          const publicUrl = await uploadImage(compressed, userId);
          setEntries((prev) => {
            const updated = prev.map((e) =>
              e.id === entry.id
                ? { ...e, publicUrl, uploading: false }
                : e
            );
            syncParent(updated);
            return updated;
          });
        } catch (err) {
          const error =
            err instanceof Error ? err.message : "Upload failed.";
          setEntries((prev) => {
            const updated = prev.map((e) =>
              e.id === entry.id ? { ...e, uploading: false, error } : e
            );
            syncParent(updated);
            return updated;
          });
        }
      })
    );
  }

  async function handleRemove(entry: PhotoEntry) {
    if (entry.publicUrl) {
      try {
        await deleteImage(entry.publicUrl);
      } catch {
        // If delete fails, still remove from UI
      }
    }
    if (entry.preview.startsWith("blob:")) {
      URL.revokeObjectURL(entry.preview);
    }
    setEntries((prev) => {
      const updated = prev.filter((e) => e.id !== entry.id);
      if (variant === "gallery" && selectedId === entry.id) {
        setSelectedId(updated.length > 0 ? updated[0].id : null);
      }
      syncParent(updated);
      return updated;
    });
  }

  // ── Drag-to-reorder (grid mode only) ──────────────────────────
  const dragId = useRef<string | null>(null);
  const dragOverId = useRef<string | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const [dragOverThumbnail, setDragOverThumbnail] = useState<string | null>(null);
  const canAddMore = entries.length < maxFiles;

  function handleDropZoneDragOver(e: React.DragEvent) {
    if (!dragId.current && e.dataTransfer.types.includes("Files")) {
      e.preventDefault();
      setDropActive(true);
    }
  }

  function handleDropZoneDragLeave() {
    setDropActive(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDropActive(false);
    if (dragId.current) return;
    handleFiles(e.dataTransfer.files);
  }

  function handleDragStart(id: string) {
    dragId.current = id;
  }

  function handleThumbnailDragOver(e: React.DragEvent, overId: string) {
    if (!dragId.current) return;
    e.preventDefault();
    dragOverId.current = overId;
    setDragOverThumbnail(overId);
  }

  function handleThumbnailDragLeave() {
    setDragOverThumbnail(null);
  }

  function handleThumbnailDrop(e: React.DragEvent, overId: string) {
    e.preventDefault();
    setDragOverThumbnail(null);
    if (!dragId.current || dragId.current === overId) return;
    setEntries((prev) => {
      const from = prev.findIndex((e) => e.id === dragId.current);
      const to = prev.findIndex((e) => e.id === overId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      next.splice(to, 0, next.splice(from, 1)[0]);
      syncParent(next);
      return next;
    });
  }

  function handleDragEnd() {
    dragId.current = null;
    dragOverId.current = null;
    setDragOverThumbnail(null);
  }

  // ── Gallery helpers (used when variant === "gallery") ─────────
  const selectedEntry = entries.find((e) => e.id === selectedId) ?? entries[0] ?? null;
  const selectedIndex = selectedEntry ? entries.indexOf(selectedEntry) : -1;

  const goPrev = () => {
    if (entries.length < 2 || selectedIndex <= 0) return;
    setSelectedId(entries[selectedIndex - 1].id);
  };

  const goNext = () => {
    if (entries.length < 2 || selectedIndex >= entries.length - 1) return;
    setSelectedId(entries[selectedIndex + 1].id);
  };

  // ── Gallery variant ───────────────────────────────────────────
  if (variant === "gallery") {
    return (
      <div className="flex flex-col gap-3">
        {/* Primary image */}
        {selectedEntry ? (
          <div className="group relative aspect-square w-full overflow-hidden rounded-xl border border-[#E0D8CC] bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedEntry.preview}
              alt=""
              className="h-full w-full object-cover"
            />

            {selectedEntry.uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <svg className="h-8 w-8 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              </div>
            )}

            {selectedEntry.error && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-500/80 p-4">
                <p className="text-center text-sm text-white">{selectedEntry.error}</p>
              </div>
            )}

            {/* Prev / Next arrows */}
            {entries.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={selectedIndex <= 0}
                  aria-label="Previous photo"
                  className="absolute left-2 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow transition-opacity hover:bg-white disabled:opacity-30"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  disabled={selectedIndex >= entries.length - 1}
                  aria-label="Next photo"
                  className="absolute right-2 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow transition-opacity hover:bg-white disabled:opacity-30"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Remove button */}
            {!selectedEntry.uploading && (
              <button
                type="button"
                onClick={() => handleRemove(selectedEntry)}
                aria-label="Remove photo"
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Dot indicators */}
            {entries.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {entries.map((e, i) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setSelectedId(e.id)}
                    aria-label={`Photo ${i + 1}`}
                    className="h-1.5 w-1.5 rounded-full transition-colors"
                    style={{ backgroundColor: e.id === selectedId ? "#2D5A45" : "#E0D8CC" }}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          // Empty drop zone
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={handleDropZoneDragOver}
            onDragLeave={handleDropZoneDragLeave}
            onDrop={handleDrop}
            className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-14 text-sm transition-colors ${
              dropActive
                ? "border-[#2D5A45] bg-[#2D5A45]/5 text-[#2D5A45]"
                : "border-[#C8BFB0] bg-[#FDFCFA] text-gray-400 hover:border-[#2D5A45] hover:text-[#2D5A45]"
            }`}
          >
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-medium">Add photos</span>
          </button>
        )}

        {/* Thumbnail strip */}
        {(entries.length > 0) && (
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {entries.map((entry, i) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setSelectedId(entry.id)}
                aria-label={`Photo ${i + 1}`}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                  entry.id === selectedId
                    ? "border-[#2D5A45]"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={entry.preview} alt="" className="h-full w-full object-cover" />
                {entry.uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <svg className="h-3 w-3 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  </div>
                )}
              </button>
            ))}

            {canAddMore && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-[#C8BFB0] text-gray-400 transition-colors hover:border-[#2D5A45] hover:text-[#2D5A45]"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
        />
      </div>
    );
  }

  // ── Default grid variant ──────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">
      {entries.length > 0 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {entries.map((entry) => (
            <div
              key={entry.id}
              draggable={!entry.uploading}
              onDragStart={() => handleDragStart(entry.id)}
              onDragOver={(e) => handleThumbnailDragOver(e, entry.id)}
              onDragLeave={handleThumbnailDragLeave}
              onDrop={(e) => handleThumbnailDrop(e, entry.id)}
              onDragEnd={handleDragEnd}
              className={`group relative aspect-square cursor-grab overflow-hidden rounded-lg border bg-white transition-all active:cursor-grabbing active:opacity-50 ${
                dragOverThumbnail === entry.id
                  ? "border-[#2D5A45] ring-2 ring-[#2D5A45]/40 scale-105"
                  : "border-[#E0D8CC]"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={entry.preview} alt="" className="h-full w-full object-cover" />

              {entry.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                </div>
              )}

              {entry.error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500/80 p-1">
                  <p className="text-center text-[10px] leading-tight text-white">{entry.error}</p>
                </div>
              )}

              {!entry.uploading && (
                <button
                  type="button"
                  onClick={() => handleRemove(entry)}
                  aria-label="Remove photo"
                  className="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white transition group-hover:flex"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canAddMore && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={handleDropZoneDragOver}
            onDragLeave={handleDropZoneDragLeave}
            onDrop={handleDrop}
            className={`flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed py-5 text-sm transition-colors ${
              dropActive
                ? "border-[#2D5A45] bg-[#2D5A45]/5 text-[#2D5A45]"
                : "border-[#C8BFB0] bg-[#FDFCFA] text-gray-500 hover:border-[#2D5A45] hover:text-[#2D5A45]"
            }`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>{dropActive ? "Drop to upload" : entries.length === 0 ? "Add photos" : "Add more"}</span>
            <span className="text-xs text-gray-400">
              {dropActive ? "" : `drag & drop or click · ${entries.length}/${maxFiles}`}
            </span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
          />
        </>
      )}
    </div>
  );
}
