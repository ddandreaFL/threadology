"use client";

import { useRef, useState } from "react";
import { updateCropPositions } from "@/lib/actions/pieces";

type CropPos = { x: number; y: number };
type CropPositions = Record<string, CropPos>;

interface ImageAdjusterProps {
  photoUrl: string;
  photoIndex: number;
  initialPosition: CropPos;
  pieceId: string;
  allCropPositions: CropPositions;
  onClose: () => void;
  onSaved: (index: number, pos: CropPos) => void;
}

export function ImageAdjuster({
  photoUrl,
  photoIndex,
  initialPosition,
  pieceId,
  allCropPositions,
  onClose,
  onSaved,
}: ImageAdjusterProps) {
  const [position, setPosition] = useState<CropPos>(initialPosition);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startPointer = useRef<CropPos>({ x: 0, y: 0 });
  const startPosition = useRef<CropPos>({ x: 50, y: 50 });
  // Natural image dimensions — used to calculate per-axis drag sensitivity
  const naturalSize = useRef<{ w: number; h: number } | null>(null);

  function handleImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    naturalSize.current = {
      w: e.currentTarget.naturalWidth,
      h: e.currentTarget.naturalHeight,
    };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDragging.current = true;
    startPointer.current = { x: e.clientX, y: e.clientY };
    startPosition.current = { ...position };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const size = rect.width; // square container

    // Calculate how much of the image overflows the square frame
    // (determines how far object-position can actually move the image)
    let overflowX = 0;
    let overflowY = 0;
    if (naturalSize.current) {
      const { w, h } = naturalSize.current;
      const ar = w / h;
      if (ar > 1) {
        // Landscape: height fills frame, width overflows
        overflowX = size * ar - size;
      } else {
        // Portrait: width fills frame, height overflows
        overflowY = size / ar - size;
      }
    } else {
      // Fallback before image loads
      overflowX = size * 0.5;
      overflowY = size * 0.5;
    }

    // 100% object-position change = overflowX/Y pixels of movement
    const sensX = overflowX > 0 ? 100 / overflowX : 0;
    const sensY = overflowY > 0 ? 100 / overflowY : 0;

    const dx = (e.clientX - startPointer.current.x) * sensX;
    const dy = (e.clientY - startPointer.current.y) * sensY;

    setPosition({
      x: Math.max(0, Math.min(100, startPosition.current.x - dx)),
      y: Math.max(0, Math.min(100, startPosition.current.y - dy)),
    });
  }

  function handlePointerUp() {
    isDragging.current = false;
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated: CropPositions = {
        ...allCropPositions,
        [String(photoIndex)]: position,
      };
      await updateCropPositions(pieceId, updated);
      onSaved(photoIndex, position);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base text-gray-900">Reposition photo</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 transition-colors hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-500">
          Drag to adjust how the photo is cropped in the square frame.
        </p>

        {/* Drag crop frame */}
        <div
          ref={containerRef}
          className="aspect-square w-full cursor-grab touch-none select-none overflow-hidden rounded-xl active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt="Adjust crop position"
            draggable={false}
            onLoad={handleImageLoad}
            className="pointer-events-none h-full w-full select-none object-cover"
            style={{ objectPosition: `${position.x}% ${position.y}%` }}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-[#E0D8CC] bg-[#FDFCFA] py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-lg bg-[#2D5A45] py-2 text-sm text-white transition-colors hover:bg-[#1E3D2F] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
