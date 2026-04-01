"use client";

import { useRef, useState } from "react";
import { uploadImage, deleteImage } from "@/lib/storage";

interface PhotoEntry {
  id: string;
  preview: string;    // blob URL while uploading, public URL after
  publicUrl: string | null;
  uploading: boolean;
  error: string | null;
}

interface PhotoUploadProps {
  userId: string;
  value: string[];                       // current public URLs (controlled)
  onChange: (urls: string[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
  maxFiles?: number;
}

export function PhotoUpload({
  userId,
  value,
  onChange,
  onUploadingChange,
  maxFiles = 8,
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // We track entries locally so we can show per-photo state;
  // value (public URLs) is the source of truth for the parent.
  const [entries, setEntries] = useState<PhotoEntry[]>(() =>
    value.map((url) => ({
      id: url,
      preview: url,
      publicUrl: url,
      uploading: false,
      error: null,
    }))
  );

  function setEntryState(id: string, patch: Partial<PhotoEntry>) {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch } : e))
    );
  }

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
    onUploadingChange?.(true);

    await Promise.all(
      newEntries.map(async (entry, i) => {
        try {
          const publicUrl = await uploadImage(batch[i], userId);
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
        // If delete fails, still remove from UI — the file can be cleaned up later.
      }
    }
    if (entry.preview.startsWith("blob:")) {
      URL.revokeObjectURL(entry.preview);
    }
    setEntries((prev) => {
      const updated = prev.filter((e) => e.id !== entry.id);
      syncParent(updated);
      return updated;
    });
  }

  const dragId = useRef<string | null>(null);
  const canAddMore = entries.length < maxFiles;

  function handleDragStart(id: string) {
    dragId.current = id;
  }

  function handleDragOver(e: React.DragEvent, overId: string) {
    e.preventDefault();
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
    dragId.current = overId;
  }

  function handleDragEnd() {
    dragId.current = null;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Thumbnails grid */}
      {entries.length > 0 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {entries.map((entry) => (
            <div
              key={entry.id}
              draggable={!entry.uploading}
              onDragStart={() => handleDragStart(entry.id)}
              onDragOver={(e) => handleDragOver(e, entry.id)}
              onDragEnd={handleDragEnd}
              className="group relative aspect-square cursor-grab overflow-hidden rounded-lg border border-[#E0D8CC] bg-[#F5F1EA] active:cursor-grabbing"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entry.preview}
                alt=""
                className="h-full w-full object-cover"
              />

              {/* Uploading overlay */}
              {entry.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <svg
                    className="h-5 w-5 animate-spin text-white"
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
                </div>
              )}

              {/* Error overlay */}
              {entry.error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500/80 p-1">
                  <p className="text-center text-[10px] leading-tight text-white">
                    {entry.error}
                  </p>
                </div>
              )}

              {/* Remove button */}
              {!entry.uploading && (
                <button
                  type="button"
                  onClick={() => handleRemove(entry)}
                  aria-label="Remove photo"
                  className="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white transition group-hover:flex"
                >
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add photos button */}
      {canAddMore && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#C8BFB0] bg-[#FDFCFA] py-3 text-sm text-gray-500 transition-colors hover:border-[#2D5A45] hover:text-[#2D5A45]"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
            {entries.length === 0 ? "Add photos" : "Add more"}
            <span className="text-xs text-gray-400">
              ({entries.length}/{maxFiles})
            </span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            onClick={(e) => {
              // Reset value so same file can be re-selected after removal
              (e.target as HTMLInputElement).value = "";
            }}
          />
        </>
      )}
    </div>
  );
}
