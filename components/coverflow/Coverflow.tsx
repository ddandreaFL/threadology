"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";

/**
 * The cover flow, on the web — threadology-native/components/CoverflowView.tsx
 * restated for a browser. Same geometry (cards 3:4, a share of the width,
 * 16px apart) and the same curve: at one card from center a card turns 28°,
 * scales to 0.85 and fades to 0.5; at two, 45°, 0.72 and 0.2.
 *
 * Scrolling is the browser's own, snapping to cards, so touch, trackpad and
 * wheel all behave natively. Programmatic moves are flights, as in the app:
 * a step (a flick), a glide (eased both ends), a spin (fast out, long
 * settle, scaled to distance) and a drift (linear), each one animation of
 * scrollLeft, landing exactly on a card. Arrow keys step on desktop.
 */

export type CoverflowItem = { id: string; photo: string | null; alt: string };
export type FlightKind = "step" | "glide" | "spin" | "drift";
export type CoverflowHandle = {
  flyTo: (index: number, kind?: FlightKind, msPerCard?: number, onLand?: () => void) => boolean;
  halt: () => void;
  isFlying: () => boolean;
  /** Where the centered card sits on screen, in viewport pixels. */
  measureActiveCard: () => DOMRect | null;
};

const SPACING = 16;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
// The app's spin: bezier(0.12, 0.62, 0.12, 1), approximated.
const easeSpin = (t: number) => 1 - Math.pow(1 - t, 4.2);
const linear = (t: number) => t;

function flight(kind: FlightKind, cards: number, msPerCard = 6000) {
  if (kind === "spin") return { ms: Math.min(1500, 520 + Math.min(cards, 24) * 42), ease: easeSpin };
  if (kind === "drift") return { ms: msPerCard * cards, ease: linear };
  if (kind === "glide") return { ms: 700, ease: easeInOutCubic };
  return { ms: 340, ease: easeOutCubic };
}

export const Coverflow = forwardRef<
  CoverflowHandle,
  {
    items: CoverflowItem[];
    index: number;
    /** Called when a card has come to rest (and as a drift passes each card). */
    onIndexChange: (i: number) => void;
    onCardClick?: (i: number) => void;
    /** Card width: a share of the component's width, capped. */
    widthShare?: number;
    maxCardWidth?: number;
    hiddenIndex?: number | null;
    /** A finger or wheel took over. */
    onUserInteract?: () => void;
    className?: string;
  }
>(function Coverflow(
  { items, index, onIndexChange, onCardClick, widthShare = 0.6, maxCardWidth = 380, hiddenIndex = null, onUserInteract, className },
  ref
) {
  const scroller = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [box, setBox] = useState(0);
  const raf = useRef<number | null>(null);
  const flying = useRef(false);
  const lastReported = useRef(index);

  const cardWidth = Math.min(Math.round(box * widthShare), maxCardWidth);
  const cardHeight = Math.round((cardWidth * 4) / 3);
  const item = cardWidth + SPACING;
  const pad = (box - item) / 2;

  // Width is measured, not assumed: the component sits in phone screens,
  // desktop columns and the gallery.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox(el.clientWidth));
    ro.observe(el);
    setBox(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Paint every card from the scroll position — the app's curve.
  const paint = useCallback(() => {
    const el = scroller.current;
    if (!el || item <= 0) return;
    const pos = el.scrollLeft / item;
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const off = Math.max(-2, Math.min(2, i - pos));
      const a = Math.abs(off);
      const lerp = (v0: number, v1: number, v2: number) => (a <= 1 ? v0 + (v1 - v0) * a : v1 + (v2 - v1) * (a - 1));
      const rot = lerp(0, 28, 45) * Math.sign(off);
      card.style.transform = `perspective(900px) rotateY(${rot}deg) scale(${lerp(1, 0.85, 0.72)})`;
      card.style.opacity = String(lerp(1, 0.5, 0.2));
    });
  }, [item]);

  // Open on the caller's card.
  const placed = useRef(false);
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el || item <= 0) return;
    if (!placed.current) {
      el.scrollLeft = index * item;
      placed.current = true;
    }
    paint();
  }, [item, index, paint]);

  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onScroll = () => {
    paint();
    if (flying.current) return;
    // The browser has no "momentum ended"; a short quiet period stands in.
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const el = scroller.current;
      if (!el) return;
      const i = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollLeft / item)));
      if (i !== lastReported.current) {
        lastReported.current = i;
        onIndexChange(i);
      }
    }, 120);
  };

  const halt = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    flying.current = false;
    if (scroller.current) scroller.current.style.scrollSnapType = "";
  }, []);

  const flyTo = useCallback(
    (target: number, kind: FlightKind = "step", msPerCard?: number, onLand?: () => void) => {
      const el = scroller.current;
      if (!el || flying.current || items.length === 0) return false;
      const to = Math.max(0, Math.min(items.length - 1, target));
      const from = el.scrollLeft;
      const dest = to * item;
      const cards = Math.abs(dest - from) / item;
      if (cards < 0.01) {
        lastReported.current = to;
        onIndexChange(to);
        onLand?.();
        return true;
      }
      const { ms, ease } = flight(kind, cards, msPerCard);
      flying.current = true;
      // Snapping fights a scripted scroll; it is off for the flight.
      el.style.scrollSnapType = "none";
      const start = performance.now();
      const frame = (now: number) => {
        const t = Math.min(1, (now - start) / ms);
        el.scrollLeft = from + (dest - from) * ease(t);
        if (kind === "drift") {
          const i = Math.round(el.scrollLeft / item);
          if (i !== lastReported.current) {
            lastReported.current = i;
            onIndexChange(i);
          }
        }
        if (t < 1) {
          raf.current = requestAnimationFrame(frame);
        } else {
          flying.current = false;
          raf.current = null;
          el.style.scrollSnapType = "";
          lastReported.current = to;
          onIndexChange(to);
          onLand?.();
        }
      };
      raf.current = requestAnimationFrame(frame);
      return true;
    },
    [items.length, item, onIndexChange]
  );

  useImperativeHandle(
    ref,
    () => ({
      flyTo,
      halt,
      isFlying: () => flying.current,
      measureActiveCard: () => cardRefs.current[lastReported.current]?.getBoundingClientRect() ?? null,
    }),
    [flyTo, halt]
  );

  useEffect(() => () => halt(), [halt]);

  return (
    <div
      ref={scroller}
      onScroll={onScroll}
      onPointerDown={() => {
        halt();
        onUserInteract?.();
      }}
      onWheel={() => {
        if (flying.current) {
          halt();
          onUserInteract?.();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") flyTo(lastReported.current + 1, "glide");
        if (e.key === "ArrowLeft") flyTo(lastReported.current - 1, "glide");
      }}
      tabIndex={0}
      aria-roledescription="carousel"
      className={`flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className ?? ""}`}
      style={{ paddingLeft: pad, paddingRight: pad, height: cardHeight || undefined }}
    >
      {box > 0 &&
        items.map((it, i) => (
          <div key={it.id} className="flex shrink-0 snap-center items-center justify-center" style={{ width: item, height: cardHeight, opacity: i === hiddenIndex ? 0 : 1 }}>
            <div
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              onClick={() => onCardClick?.(i)}
              className="cursor-pointer overflow-hidden rounded-th-card bg-[#F0F0F0] will-change-transform"
              style={{ width: cardWidth, height: cardHeight }}
            >
              {it.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.photo} alt={it.alt} draggable={false} className="h-full w-full select-none object-cover" loading={Math.abs(i - index) < 4 ? "eager" : "lazy"} />
              ) : (
                <div className="flex h-full items-center justify-center text-5xl text-[#CCCCCC]">✦</div>
              )}
            </div>
          </div>
        ))}
    </div>
  );
});
