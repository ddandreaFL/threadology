"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";

type Piece = {
  id: string;
  brand: string;
  type: string;
  name: string | null;
  year: string | null;
  photos: string[];
  crop_positions: Record<string, { x: number; y: number }> | null;
};

interface CoverflowViewProps {
  pieces: Piece[];
  basePath: string;
  activeIndex: number;
  onActiveChange: (index: number) => void;
}

export function CoverflowView({ pieces, basePath, activeIndex, onActiveChange }: CoverflowViewProps) {
  const touchStartX = useRef<number | null>(null);
  const safeIndex = Math.min(activeIndex, pieces.length - 1);
  const activePiece = pieces[safeIndex];
  const displayName = activePiece ? (activePiece.name ?? activePiece.type) : "";
  const brandYear = activePiece
    ? [activePiece.brand, activePiece.year].filter(Boolean).join(" · ")
    : "";

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    if (delta < 0 && safeIndex < pieces.length - 1) onActiveChange(safeIndex + 1);
    else if (delta > 0 && safeIndex > 0) onActiveChange(safeIndex - 1);
  }

  // Limit dots to 15 max; show a sliding window centered on active
  const totalDots = Math.min(pieces.length, 15);
  const dotOffset = Math.max(0, Math.min(safeIndex - 7, pieces.length - totalDots));

  return (
    <div className="flex h-full flex-col pb-24 pt-4" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* 3D stage — flex-1 fills available height */}
      <div
        className="relative flex-1 overflow-hidden"
        style={{ perspective: "1000px" }}
      >
        {pieces.map((piece, index) => {
          const off = index - safeIndex;
          if (Math.abs(off) > 2) return null;

          const rotateY = off * -48;
          const translateX = off * 118;
          const scale = 1 - Math.abs(off) * 0.2;
          const opacity = 1 - Math.abs(off) * 0.32;
          const zIndex = 10 - Math.abs(off) * 2;
          const isActive = off === 0;
          const cropPos = piece.crop_positions?.["0"];
          const label = piece.name ?? piece.type;

          const cardStyle: React.CSSProperties = {
            position: "absolute",
            width: 192,
            height: 272,
            borderRadius: 14,
            top: "calc(50% - 136px)",
            left: "calc(50% - 96px)",
            transform: `translateX(${translateX}px) rotateY(${rotateY}deg) scale(${scale})`,
            opacity,
            zIndex,
            overflow: "hidden",
            transition: "transform 0.38s cubic-bezier(0.25,0.1,0.25,1), opacity 0.38s",
            boxShadow: isActive ? "0 12px 40px rgba(0,0,0,0.18)" : "none",
            cursor: "pointer",
          };

          const content = piece.photos[0] ? (
            <Image
              src={piece.photos[0]}
              alt={label}
              fill
              sizes="192px"
              className="object-cover"
              style={cropPos ? { objectPosition: `${cropPos.x}% ${cropPos.y}%` } : undefined}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#F5F5F5]">
              <svg className="h-10 w-10 text-[#CCCCCC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z" />
              </svg>
            </div>
          );

          if (isActive) {
            return (
              <Link key={piece.id} href={`${basePath}/${piece.id}`} style={cardStyle}>
                {content}
              </Link>
            );
          }

          return (
            <div key={piece.id} style={cardStyle} onClick={() => onActiveChange(index)}>
              {content}
            </div>
          );
        })}
      </div>

      {/* Piece info */}
      <div className="mt-5 text-center">
        <p className="text-[16px] font-medium text-[#111111]">{displayName}</p>
        <p className="mt-1 text-[12px] text-[#999999]">{brandYear}</p>
      </div>

      {/* Dot navigation */}
      {pieces.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-[6px]">
          {Array.from({ length: totalDots }, (_, i) => {
            const pieceIdx = dotOffset + i;
            const isActiveDot = pieceIdx === safeIndex;
            return (
              <button
                key={pieceIdx}
                onClick={() => onActiveChange(pieceIdx)}
                style={{
                  width: isActiveDot ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: isActiveDot ? "#111111" : "#DEDEDE",
                  transition: "width 0.2s ease, background-color 0.2s ease",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
                aria-label={`Go to piece ${pieceIdx + 1}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
