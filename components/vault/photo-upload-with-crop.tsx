"use client";

import { useRef, useState } from "react";
import { uploadImage, deleteImage } from "@/lib/storage";
import { compressImage } from "@/lib/compress";

type CropPos = { x: number; y: number };

interface PhotoEntry {
  id: string;
  preview: string;
  publicUrl: string | null;
  uploading: boolean;
  error: string | null;
  cropPos: CropPos;
}

interface PhotoUploadWithCropProps {
  userId: string;
  photos: string[];
  cropPositions: Record<string, CropPos>;
  onPhotosChange: (photos: string[]) => void;
  onCropPositionsChange: (positions: Record<string, CropPos>) => void;
  onUploadingChange?: (uploading: boolean) => void;
  maxFiles?: number;
}

export function PhotoUploadWithCrop({
  userId,
  photos,
  cropPositions,
  onPhotosChange,
  onCropPositionsChange,
  onUploadingChange,
  maxFiles = 6,
}: PhotoUploadWithCropProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cropRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startPtr = useRef<CropPos>({ x: 0, y: 0 });
  const startPos = useRef<CropPos>({ x: 50, y: 50 });
  const natSize = useRef<{ w: number; h: number } | null>(null);
  const [dropActive, setDropActive] = useState(false);

  const [entries, setEntries] = useState<PhotoEntry[]>(() =>
    photos.map((url, i) => ({
      id: url,
      preview: url,
      publicUrl: url,
      uploading: false,
      error: null,
      cropPos: cropPositions[String(i)] ?? { x: 50, y: 50 },
    }))
  );

  const [focusedId, setFocusedId] = useState<string | null>(
    photos.length > 0 ? photos[0] : null
  );

  function syncParent(updated: PhotoEntry[]) {
    const ready = updated.filter((e) => e.publicUrl !== null);
    onPhotosChange(ready.map((e) => e.publicUrl as string));
    const positions: Record<string, CropPos> = {};
    ready.forEach((e, i) => {
      positions[String(i)] = e.cropPos;
    });
    onCropPositionsChange(positions);
    onUploadingChange?.(updated.some((e) => e.uploading));
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const batch = Array.from(files).slice(0, maxFiles - entries.length);
    if (batch.length === 0) return;

    const newEntries: PhotoEntry[] = batch.map((file) => ({
      id: crypto.randomUUID(),
      preview: URL.createObjectURL(file),
      publicUrl: null,
      uploading: true,
      error: null,
      cropPos: { x: 50, y: 50 },
    }));

    setFocusedId(newEntries[0].id);
    natSize.current = null;

    const next = [...entries, ...newEntries];
    setEntries(next);
    onUploadingChange?.(true);

    await Promise.all(
      newEntries.map(async (entry, i) => {
        try {
          const compressed = await compressImage(batch[i]);
          const publicUrl = await uploadImage(compressed, userId);
          setEntries((prev) => {
            const updated = prev.map((e) =>
              e.id === entry.id ? { ...e, publicUrl, uploading: false } : e
            );
            syncParent(updated);
            return updated;
          });
        } catch (err) {
          const error = err instanceof Error ? err.message : "Upload failed.";
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
        // continue — can be cleaned up later
      }
    }
    if (entry.preview.startsWith("blob:")) URL.revokeObjectURL(entry.preview);
    setEntries((prev) => {
      const updated = prev.filter((e) => e.id !== entry.id);
      if (focusedId === entry.id) {
        const next = updated.length > 0 ? updated[0].id : null;
        setFocusedId(next);
        natSize.current = null;
      }
      syncParent(updated);
      return updated;
    });
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const focused = entries.find((en) => en.id === focusedId);
    if (!focused || focused.uploading) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isDragging.current = true;
    startPtr.current = { x: e.clientX, y: e.clientY };
    startPos.current = { ...focused.cropPos };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging.current || !cropRef.current || !focusedId) return;
    const rect = cropRef.current.getBoundingClientRect();
    const size = rect.width;
    let ox = 0, oy = 0;
    if (natSize.current) {
      const ar = natSize.current.w / natSize.current.h;
      if (ar > 1) ox = size * ar - size;
      else oy = size / ar - size;
    } else {
      ox = oy = size * 0.5;
    }
    const sx = ox > 0 ? 100 / ox : 0;
    const sy = oy > 0 ? 100 / oy : 0;
    const dx = (e.clientX - startPtr.current.x) * sx;
    const dy = (e.clientY - startPtr.current.y) * sy;
    const newPos: CropPos = {
      x: Math.max(0, Math.min(100, startPos.current.x - dx)),
      y: Math.max(0, Math.min(100, startPos.current.y - dy)),
    };
    setEntries((prev) => {
      const updated = prev.map((e) =>
        e.id === focusedId ? { ...e, cropPos: newPos } : e
      );
      syncParent(updated);
      return updated;
    });
  }

  function handlePointerUp() {
    isDragging.current = false;
  }

  function handleRecenter() {
    setEntries((prev) => {
      const updated = prev.map((e) =>
        e.id === focusedId ? { ...e, cropPos: { x: 50, y: 50 } } : e
      );
      syncParent(updated);
      return updated;
    });
  }

  const focused = entries.find((e) => e.id === focusedId);
  const canAddMore = entries.length < maxFiles;

  if (entries.length === 0) {
    return (
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes("Files")) {
              e.preventDefault();
              setDropActive(true);
            }
          }}
          onDragLeave={() => setDropActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDropActive(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-14 text-sm transition-colors ${
            dropActive
              ? "border-[#2D5A45] bg-[#2D5A45]/5 text-[#2D5A45]"
              : "border-[#C8BFB0] bg-[#FDFCFA] text-gray-400 hover:border-[#2D5A45] hover:text-[#2D5A45]"
          }`}
        >
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="font-medium">Add photos</span>
          <span className="text-xs text-gray-400">
            Drag &amp; drop or click &middot; up to {maxFiles} photos
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          onClick={(e) => {
            (e.target as HTMLInputElement).value = "";
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Primary crop frame */}
      {focused && (
        <div className="flex flex-col gap-2">
          <div
            ref={cropRef}
            className={`relative aspect-square w-full overflow-hidden rounded-xl border border-[#E0D8CC] bg-[#F5F1EA] ${
              focused.uploading
                ? "cursor-wait"
                : "cursor-grab touch-none select-none active:cursor-grabbing"
            }`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={focused.preview}
              alt="Adjust crop"
              draggable={false}
              onLoad={(e) => {
                natSize.current = {
                  w: e.currentTarget.naturalWidth,
                  h: e.currentTarget.naturalHeight,
                };
              }}
              className="pointer-events-none h-full w-full select-none object-cover"
              style={{
                objectPosition: `${focused.cropPos.x}% ${focused.cropPos.y}%`,
              }}
            />

            {focused.uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <svg
                  className="h-8 w-8 animate-spin text-white"
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

            {focused.error && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-500/80 p-4">
                <p className="text-center text-sm text-white">{focused.error}</p>
              </div>
            )}

            {!focused.uploading && !focused.error && (
              <div className="pointer-events-none absolute bottom-3 left-0 right-0 flex justify-center">
                <span className="rounded-full bg-black/40 px-3 py-1 font-mono-display text-[10px] uppercase tracking-widest text-white/90">
                  Drag to reposition
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRecenter}
              disabled={focused.uploading}
              className="flex items-center gap-1.5 rounded-lg border border-[#E0D8CC] bg-[#FDFCFA] px-3 py-1.5 font-mono-display text-xs text-gray-500 transition-colors hover:bg-[#F5F1EA] disabled:opacity-40"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
              Recenter
            </button>
            <button
              type="button"
              onClick={() => handleRemove(focused)}
              disabled={focused.uploading}
              className="flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 font-mono-display text-xs text-red-500 transition-colors hover:bg-red-100 disabled:opacity-40"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Thumbnail strip + add more */}
      {(entries.length > 1 || canAddMore) && (
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {entries.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => {
                setFocusedId(entry.id);
                natSize.current = null;
              }}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                entry.id === focusedId
                  ? "border-[#2D5A45]"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entry.preview}
                alt=""
                className="h-full w-full object-cover"
                style={{
                  objectPosition: `${entry.cropPos.x}% ${entry.cropPos.y}%`,
                }}
              />
              {entry.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <svg
                    className="h-3 w-3 animate-spin text-white"
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
            </button>
          ))}

          {canAddMore && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-[#C8BFB0] text-gray-400 transition-colors hover:border-[#2D5A45] hover:text-[#2D5A45]"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        onClick={(e) => {
          (e.target as HTMLInputElement).value = "";
        }}
      />
    </div>
  );
}
