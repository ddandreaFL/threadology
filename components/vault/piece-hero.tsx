"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageAdjuster } from "./image-adjuster";

type CropPositions = Record<string, { x: number; y: number }>;

interface PieceHeroProps {
  photos: string[];
  cropPositions: CropPositions | null;
  displayName: string;
  pieceId?: string;
  isOwner?: boolean;
}

export function PieceHero({
  photos,
  cropPositions: initialCropPositions,
  displayName,
  pieceId,
  isOwner = false,
}: PieceHeroProps) {
  const [cropPositions, setCropPositions] = useState<CropPositions>(
    initialCropPositions ?? {}
  );
  const [heroIndex, setHeroIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [adjustingIndex, setAdjustingIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return <div className="h-[380px] w-full bg-[#F5F5F5]" />;
  }

  function cropStyle(index: number): React.CSSProperties {
    const pos = cropPositions[String(index)];
    return { objectPosition: pos ? `${pos.x}% ${pos.y}%` : "50% 40%" };
  }

  return (
    <>
      <div className="relative h-[380px] w-full overflow-hidden bg-[#F5F5F5]">
        {photos.map((url, i) => (
          <Image
            key={url}
            src={url}
            alt={`${displayName} ${i + 1}`}
            fill
            sizes="100vw"
            priority={i === 0}
            className="object-cover transition-opacity duration-300"
            style={{ ...cropStyle(i), opacity: i === heroIndex ? 1 : 0 }}
          />
        ))}

        {/* Reposition — owner only, bottom-left */}
        {isOwner && pieceId && (
          <button
            onClick={() => setAdjustingIndex(heroIndex)}
            className="absolute bottom-4 left-4 z-10 flex h-8 items-center gap-1.5 rounded-full bg-black/35 pl-2.5 pr-3 backdrop-blur-sm transition-opacity hover:opacity-80"
            aria-label="Reposition photo"
          >
            <svg className="h-[11px] w-[11px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span className="text-[11px] text-white/90">reposition</span>
          </button>
        )}

        {/* Expand / lightbox — bottom-right */}
        <button
          onClick={() => { setLightboxIndex(heroIndex); setLightboxOpen(true); }}
          className="absolute bottom-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/35 backdrop-blur-sm transition-opacity hover:opacity-80"
          aria-label="View fullscreen"
        >
          <svg className="h-[13px] w-[13px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 3h6m0 0v6m0-6l-7 7M9 21H3m0 0v-6m0 6l7-7" />
          </svg>
        </button>

        {/* Dot indicators */}
        {photos.length > 1 && (
          <div className="absolute bottom-[18px] left-0 right-0 flex justify-center gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroIndex(i)}
                className="h-[4px] rounded-full transition-all duration-200"
                style={{
                  width: i === heroIndex ? 20 : 5,
                  backgroundColor:
                    i === heroIndex
                      ? "rgba(255,255,255,0.95)"
                      : "rgba(255,255,255,0.45)",
                }}
                aria-label={`Photo ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-opacity hover:bg-white/20"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="relative h-full w-full" onClick={(e) => e.stopPropagation()}>
            <Image
              src={photos[lightboxIndex]}
              alt={`${displayName} ${lightboxIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>

          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => (i - 1 + photos.length) % photos.length);
                }}
                className="absolute left-4 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-opacity hover:bg-white/20"
                aria-label="Previous photo"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => (i + 1) % photos.length);
                }}
                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-opacity hover:bg-white/20"
                aria-label="Next photo"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                    className="h-1 rounded-full transition-all duration-200"
                    style={{
                      width: i === lightboxIndex ? 20 : 5,
                      backgroundColor:
                        i === lightboxIndex
                          ? "rgba(255,255,255,0.95)"
                          : "rgba(255,255,255,0.4)",
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Image adjuster modal */}
      {adjustingIndex !== null && pieceId && (
        <ImageAdjuster
          photoUrl={photos[adjustingIndex]}
          photoIndex={adjustingIndex}
          initialPosition={cropPositions[String(adjustingIndex)] ?? { x: 50, y: 40 }}
          pieceId={pieceId}
          allCropPositions={cropPositions}
          onClose={() => setAdjustingIndex(null)}
          onSaved={(index, pos) => {
            setCropPositions((prev) => ({ ...prev, [String(index)]: pos }));
            setAdjustingIndex(null);
          }}
        />
      )}
    </>
  );
}
