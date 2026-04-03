"use client";

import { useRef, useState } from "react";
import { ImageAdjuster } from "./image-adjuster";

type CropPositions = Record<string, { x: number; y: number }>;

interface PhotoGalleryProps {
  photos: string[];
  alt: string;
  cropPositions?: CropPositions | null;
  /** Provide to enable the owner-only Reposition button */
  pieceId?: string;
  isOwner?: boolean;
}

export function PhotoGallery({
  photos,
  alt,
  cropPositions: initialCropPositions,
  pieceId,
  isOwner = false,
}: PhotoGalleryProps) {
  const [selected, setSelected] = useState(0);
  const [visible, setVisible] = useState(true);
  const [adjustingIndex, setAdjustingIndex] = useState<number | null>(null);
  const [cropPositions, setCropPositions] = useState<CropPositions>(
    initialCropPositions ?? {}
  );
  const touchStartX = useRef<number | null>(null);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-[#C8BFB0] bg-[#F5F1EA]">
        <p className="text-sm text-gray-400">No photos</p>
      </div>
    );
  }

  function goTo(index: number) {
    if (index === selected) return;
    setVisible(false);
    setTimeout(() => {
      setSelected(index);
      setVisible(true);
    }, 120);
  }

  function goNext() {
    goTo((selected + 1) % photos.length);
  }

  function goPrev() {
    goTo((selected - 1 + photos.length) % photos.length);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 50) return;
    if (delta < 0) goNext();
    else goPrev();
  }

  const cropPos = cropPositions[String(selected)];
  const objectPosition = cropPos ? `${cropPos.x}% ${cropPos.y}%` : "50% 50%";

  return (
    <div className="flex flex-col gap-3">
      {/* Primary image */}
      <div
        className="group relative aspect-square overflow-hidden rounded-2xl border border-[#E0D8CC] bg-[#F5F1EA]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[selected]}
          alt={alt}
          className="h-full w-full object-cover transition-opacity duration-150"
          style={{ opacity: visible ? 1 : 0, objectPosition }}
        />

        {/* Desktop prev/next arrows — hidden until hover */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-700 opacity-0 shadow transition-opacity hover:bg-white group-hover:opacity-100 focus-visible:opacity-100"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-700 opacity-0 shadow transition-opacity hover:bg-white group-hover:opacity-100 focus-visible:opacity-100"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Dot indicators */}
        {photos.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Photo ${i + 1}`}
                className="h-1.5 w-1.5 rounded-full transition-colors"
                style={{
                  backgroundColor: i === selected ? "#2D5A45" : "#E0D8CC",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Reposition button — owner only, below the image */}
      {isOwner && pieceId && (
        <div className="flex">
          <button
            type="button"
            onClick={() => setAdjustingIndex(selected)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-[#F5F1EA] hover:text-gray-600"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            Reposition photo {photos.length > 1 ? `${selected + 1}` : ""}
          </button>
        </div>
      )}

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {photos.map((url, i) => {
            const thumbCrop = cropPositions[String(i)];
            return (
              <button
                key={url}
                type="button"
                onClick={() => goTo(i)}
                className={`aspect-square overflow-hidden rounded-lg border transition-all ${
                  i === selected
                    ? "border-[#2D5A45] ring-2 ring-[#2D5A45]/30"
                    : "border-[#E0D8CC] opacity-60 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`${alt} ${i + 1}`}
                  className="h-full w-full object-cover"
                  style={{
                    objectPosition: thumbCrop
                      ? `${thumbCrop.x}% ${thumbCrop.y}%`
                      : "50% 50%",
                  }}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Image adjuster modal */}
      {adjustingIndex !== null && pieceId && (
        <ImageAdjuster
          photoUrl={photos[adjustingIndex]}
          photoIndex={adjustingIndex}
          initialPosition={cropPositions[String(adjustingIndex)] ?? { x: 50, y: 50 }}
          pieceId={pieceId}
          allCropPositions={cropPositions}
          onClose={() => setAdjustingIndex(null)}
          onSaved={(index, pos) => {
            setCropPositions((prev) => ({ ...prev, [String(index)]: pos }));
            setAdjustingIndex(null);
          }}
        />
      )}
    </div>
  );
}
