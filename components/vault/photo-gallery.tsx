"use client";

import { useState } from "react";

interface PhotoGalleryProps {
  photos: string[];
  alt: string;
}

export function PhotoGallery({ photos, alt }: PhotoGalleryProps) {
  const [selected, setSelected] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-[#C8BFB0] bg-[#F5F1EA]">
        <p className="text-sm text-gray-400">No photos</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Primary image */}
      <div className="aspect-square overflow-hidden rounded-2xl border border-[#E0D8CC] bg-[#F5F1EA]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[selected]}
          alt={alt}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {photos.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setSelected(i)}
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
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
