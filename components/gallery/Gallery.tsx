"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Coverflow, type CoverflowHandle } from "@/components/coverflow/Coverflow";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";

/**
 * Gallery mode, on the web — threadology-native/components/GalleryOverlay.tsx
 * restated for a browser. Everything but the pieces goes: the cards come up
 * larger with a wall label, on a wall of ink, stone, paper, or the piece's
 * own photo blurred. Step holds each piece and glides on; drift is one
 * unbroken scroll that loops; off leaves it to the viewer.
 *
 * Opening, one card lifts out of the page and grows into place while the
 * wall comes up behind it; closing runs it backwards into the same spot.
 * On a desktop it is also a presentation tool: arrows step, space plays,
 * F toggles full screen, Esc leaves.
 */

export type GalleryPiece = { id: string; photo: string | null; title: string; brand: string; year: string | null };
type Motion = "step" | "drift" | "off";
type Pace = "slow" | "medium" | "fast";
type Wall = "ink" | "stone" | "paper" | "blur";
type Settings = { motion: Motion; pace: Pace; wall: Wall };

const DEFAULTS: Settings = { motion: "step", pace: "medium", wall: "ink" };
const STEP_HOLD_MS: Record<Pace, number> = { slow: 7000, medium: 4500, fast: 2600 };
const DRIFT_MS_PER_PIECE: Record<Pace, number> = { slow: 11000, medium: 7000, fast: 4000 };
const IDLE_HIDE_MS = 3000;
const KEY = "gallery_settings";

function loadSettings(): Settings {
  try {
    return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<Settings>) };
  } catch {
    return DEFAULTS;
  }
}

function wallColors(wall: Wall) {
  const dark = wall === "ink" || wall === "blur";
  return {
    background: wall === "stone" ? "#F2F0EC" : wall === "paper" ? "#FFFFFF" : "#111110",
    text: dark ? "#F4F2EE" : "#1B1A17",
    muted: dark ? "rgba(244,242,238,0.55)" : "#6B6358",
    control: dark ? "rgba(255,255,255,0.12)" : "rgba(27,26,23,0.06)",
    chip: dark ? "rgba(255,255,255,0.14)" : "rgba(242,240,236,0.92)",
  };
}

export type GalleryScope = { id: string | null; label: string };

export function Gallery({
  pieces: initialPieces,
  startIndex,
  scopeLabel,
  origin,
  onClose,
  scopes,
  scopeId: initialScopeId = null,
  loadScope,
}: {
  pieces: GalleryPiece[];
  startIndex: number;
  /** Shown at the top of the wall: a collection name, or @owner for a visitor. */
  scopeLabel?: string | null;
  /** The opener's card, to lift out of and land back in. */
  origin?: DOMRect | null;
  onClose: (endIndex: number) => void;
  /** The owner's "showing" choices; absent for visitors. */
  scopes?: GalleryScope[];
  scopeId?: string | null;
  loadScope?: (id: string | null) => Promise<GalleryPiece[]>;
}) {
  const [pieces, setPieces] = useState(initialPieces);
  const [index, setIndex] = useState(Math.min(startIndex, Math.max(0, initialPieces.length - 1)));
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [playing, setPlaying] = useState(false);
  const [chrome, setChrome] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [scopeId, setScopeId] = useState(initialScopeId);
  const [label, setLabel] = useState(scopeLabel ?? null);
  const [mounted, setMounted] = useState(false);
  const cf = useRef<CoverflowHandle>(null);
  const run = useRef(0);
  const indexRef = useRef(index);
  indexRef.current = index;
  const count = pieces.length;
  const current = pieces[index];
  const c = wallColors(settings.wall);

  useEffect(() => {
    setMounted(true);
    setSettings(loadSettings());
  }, []);
  const update = (next: Partial<Settings>) =>
    setSettings((prev) => {
      const merged = { ...prev, ...next };
      try {
        localStorage.setItem(KEY, JSON.stringify(merged));
      } catch {}
      if (merged.motion === "off") setPlaying(false);
      return merged;
    });

  // ── Entry / exit: one card moves, only the wall fades ──────────────────────
  const [phase, setPhase] = useState<"entering" | "shown" | "leaving">("entering");
  const [wallOn, setWallOn] = useState(false);
  const [stageOn, setStageOn] = useState(false);
  const [flight, setFlight] = useState<{ rect: DOMRect | { left: number; top: number; width: number; height: number }; opacity: number; ms: number } | null>(
    origin ? { rect: origin, opacity: 1, ms: 0 } : null
  );
  const target = useRef<DOMRect | null>(null);
  const entered = useRef(false);

  const onStage = useCallback(() => {
    if (entered.current) return;
    requestAnimationFrame(() => {
      const t = cf.current?.measureActiveCard();
      if (!t || entered.current) return;
      entered.current = true;
      target.current = t;
      if (!origin) setFlight({ rect: shrink(t), opacity: 0, ms: 0 });
      requestAnimationFrame(() => {
        setWallOn(true);
        setFlight({ rect: t, opacity: 1, ms: 480 });
        setTimeout(() => {
          setStageOn(true);
          setTimeout(() => {
            setFlight(null);
            setPhase("shown");
            setChrome(true);
          }, 220);
        }, 480);
      });
    });
  }, [origin]);

  // The entrance waits for the cover flow to lay out its cards: it measures
  // its own width first, so the target card exists a frame or two in.
  useEffect(() => {
    let tries = 0;
    let raf = 0;
    const tick = () => {
      const t = cf.current?.measureActiveCard();
      if (t && t.width > 0) onStage();
      else if (tries++ < 90) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onStage]);

  const close = useCallback(() => {
    if (phase === "leaving") return;
    run.current++;
    cf.current?.halt();
    setPlaying(false);
    setSheet(false);
    setPhase("leaving");
    setChrome(false);
    const t = cf.current?.measureActiveCard() ?? target.current;
    const land = scopeId === initialScopeId ? origin : null;
    if (t) setFlight({ rect: t, opacity: 1, ms: 0 });
    setStageOn(false);
    setTimeout(() => {
      setWallOn(false);
      if (t && land) setFlight({ rect: land, opacity: 1, ms: 460 });
      else if (t) setFlight({ rect: shrink(t), opacity: 0, ms: 460 });
      setTimeout(() => onClose(indexRef.current), 470);
    }, 100);
  }, [phase, scopeId, initialScopeId, origin, onClose]);

  // ── Chrome ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!playing || !chrome || sheet) return;
    const t = setTimeout(() => setChrome(false), IDLE_HIDE_MS);
    return () => clearTimeout(t);
  }, [playing, chrome, sheet, index]);

  // ── Playback ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!playing || count < 2 || settings.motion !== "step") return;
    const r = run.current;
    const t = setTimeout(() => {
      if (run.current !== r) return;
      const atEnd = index >= count - 1;
      cf.current?.flyTo(atEnd ? 0 : index + 1, atEnd ? "spin" : "glide");
    }, STEP_HOLD_MS[settings.pace]);
    return () => clearTimeout(t);
  }, [playing, index, count, settings.motion, settings.pace]);

  useEffect(() => {
    if (!playing || count < 2 || settings.motion !== "drift") return;
    const r = ++run.current;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const alive = () => run.current === r;
    const loop = () => {
      if (!alive()) return;
      if (indexRef.current >= count - 1) {
        timer = setTimeout(() => alive() && cf.current?.flyTo(0, "spin", undefined, () => (timer = setTimeout(loop, 700))), 1400);
        return;
      }
      cf.current?.flyTo(count - 1, "drift", DRIFT_MS_PER_PIECE[settings.pace], loop);
    };
    cf.current?.halt();
    loop();
    return () => {
      // A counter, not a DOM ref: bumping it is what cancels this run.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      run.current++;
      if (timer) clearTimeout(timer);
      // The live cover flow, on purpose: a scope switch remounts it, and the
      // drift must stop (and settle) on the one on screen now.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      cf.current?.halt();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      cf.current?.flyTo(indexRef.current, "glide");
    };
  }, [playing, count, settings.motion, settings.pace]);

  const takeOver = () => {
    if (settings.motion === "drift" && playing) setPlaying(false);
    cf.current?.halt();
  };
  const step = (dir: 1 | -1) => {
    if (count < 2) return;
    takeOver();
    const t = (index + dir + count) % count;
    cf.current?.flyTo(t, Math.abs(t - index) > 1 ? "spin" : "glide");
  };
  const shuffle = () => {
    if (count < 2) return;
    takeOver();
    cf.current?.flyTo((index + 1 + Math.floor(Math.random() * (count - 1))) % count, "spin");
  };
  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };

  async function changeScope(id: string | null) {
    if (!loadScope || id === scopeId) return;
    run.current++;
    cf.current?.halt();
    setScopeId(id);
    setLabel(scopes?.find((s) => s.id === id)?.label ?? null);
    const next = await loadScope(id);
    setIndex(0);
    setPieces(next);
  }

  // Keys: the presenter's remote.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (sheet) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === " ") {
        e.preventDefault();
        if (settings.motion !== "off") setPlaying((p) => !p);
        setChrome(true);
      } else if (e.key.toLowerCase() === "f") toggleFullscreen();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  // The page underneath stays put.
  useLayoutEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Label cross-fade on landing.
  const [labelKey, setLabelKey] = useState(0);
  useEffect(() => setLabelKey((k) => k + 1), [index]);

  if (!mounted) return null;

  const fade = (on: boolean, ms: number) => ({ opacity: on ? 1 : 0, transition: `opacity ${ms}ms cubic-bezier(0.2,0.8,0.2,1)` });

  return createPortal(
    <div className="fixed inset-0 z-[90] font-th-sans" role="dialog" aria-modal aria-label="gallery">
      {/* The wall — the one thing that fades between the gallery and the page. */}
      <div className="absolute inset-0" style={{ background: c.background, ...fade(wallOn, 480) }}>
        {settings.wall === "blur" && current?.photo && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.photo} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover blur-[3.75rem] transition-opacity duration-700" />
            <div className="absolute inset-0 bg-[rgba(17,17,16,0.45)]" />
          </>
        )}
      </div>

      <button aria-label="show or hide controls" className="absolute inset-0 cursor-default" onClick={() => phase === "shown" && setChrome((v) => !v)} />

      {/* The piece and its wall label. */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-center pb-[calc(env(safe-area-inset-bottom)+5.75rem)] pt-[calc(env(safe-area-inset-top)+3.5rem)]" style={fade(stageOn, 220)}>
        <div className="pointer-events-auto">
          <Coverflow
            ref={cf}
            items={pieces.map((p) => ({ id: p.id, photo: p.photo, alt: p.title }))}
            index={index}
            onIndexChange={setIndex}
            onCardClick={() => phase === "shown" && setChrome((v) => !v)}
            onUserInteract={() => {
              setPlaying(false);
              setChrome(true);
            }}
            widthShare={0.78}
            maxCardWidth={560}
            hiddenIndex={flight ? index : null}
            key={scopeId ?? "all"}
          />
        </div>
        <div key={labelKey} className="mt-5 animate-[fadeIn_320ms_ease-out] px-8 text-center">
          <p className="truncate font-th-label font-light text-[0.6875rem] uppercase tracking-[0.2em]" style={{ color: c.muted }}>
            {current ? [current.brand, current.year].filter(Boolean).join("  ·  ") : " "}
          </p>
          <p className="mt-2 line-clamp-2 text-[1.375rem] font-medium tracking-[-0.02em] lg:text-[1.75rem]" style={{ color: c.text }}>
            {current ? current.title : count === 0 ? "nothing here yet" : " "}
          </p>
        </div>
      </div>

      {/* The lifted card, while it travels. */}
      {flight && current?.photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={current.photo}
          alt=""
          className="pointer-events-none fixed rounded-th-card object-cover"
          style={{
            left: flight.rect.left,
            top: flight.rect.top,
            width: flight.rect.width,
            height: flight.rect.height,
            opacity: flight.opacity,
            transition: flight.ms
              ? `left ${flight.ms}ms, top ${flight.ms}ms, width ${flight.ms}ms, height ${flight.ms}ms, opacity ${flight.ms}ms`
              : "none",
            transitionTimingFunction: phase === "leaving" ? "cubic-bezier(0.4,0,0.2,1)" : "cubic-bezier(0.2,0.8,0.2,1)",
          }}
        />
      )}

      {/* Chrome — everything that is not a piece. */}
      <div className={`pointer-events-none absolute inset-0 ${chrome ? "" : "cursor-none"}`} style={fade(chrome, 240)}>
        <div className="pointer-events-auto absolute inset-x-5 top-[calc(env(safe-area-inset-top)+0.75rem)] flex items-center">
          <WallChip icon="close" label="leave gallery" onClick={close} fill={c.chip} color={c.text} />
          <p className="mx-3 flex-1 truncate text-center font-th-label font-light text-[0.6875rem] uppercase tracking-[0.2em]" style={{ color: c.muted }}>
            {label ?? ""}
          </p>
          <span className="hidden lg:block">
            <WallChip icon="expand" label="full screen" onClick={toggleFullscreen} fill={c.chip} color={c.text} />
          </span>
          <span className="w-11 lg:hidden" />
        </div>
        <div className="pointer-events-auto absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] flex justify-center">
          <div className="flex h-12 items-center gap-1 rounded-3xl px-2" style={{ background: c.control }}>
            <WallControl icon="shuffle" label="shuffle" color={c.text} onClick={() => { setChrome(true); shuffle(); }} disabled={count < 2} />
            <WallControl icon="previous" label="previous" color={c.text} onClick={() => { setChrome(true); step(-1); }} disabled={count < 2} />
            {settings.motion !== "off" && (
              <WallControl icon={playing ? "pause" : "play"} label={playing ? "pause" : "play"} color={c.text} large onClick={() => { setChrome(true); setPlaying((p) => !p); }} disabled={count < 2} />
            )}
            <WallControl icon="next" label="next" color={c.text} onClick={() => { setChrome(true); step(1); }} disabled={count < 2} />
            <WallControl icon="gear" label="gallery settings" color={c.text} onClick={() => { setPlaying(false); setSheet(true); }} />
          </div>
        </div>
      </div>

      <Sheet open={sheet} tone="dark" title="gallery" onClose={() => setSheet(false)}>
        {scopes && scopes.length > 0 && (
          <>
            <SheetLabel>showing</SheetLabel>
            <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
              {scopes.map((s) => (
                <SheetChip key={s.id ?? "vault"} label={s.label} selected={s.id === scopeId} onClick={() => changeScope(s.id)} />
              ))}
            </div>
          </>
        )}
        <SheetLabel top={!!scopes?.length}>motion</SheetLabel>
        <div className="flex gap-2">
          {(["step", "drift", "off"] as Motion[]).map((m) => (
            <SheetChip key={m} label={m} selected={settings.motion === m} onClick={() => update({ motion: m })} />
          ))}
        </div>
        <p className="mt-2 text-[0.75rem] text-white/40">
          {settings.motion === "step" ? "holds each piece, then glides on" : settings.motion === "drift" ? "a slow, constant scroll" : "you move it"}
        </p>
        {settings.motion !== "off" && (
          <>
            <SheetLabel top>pace</SheetLabel>
            <div className="flex gap-2">
              {(["slow", "medium", "fast"] as Pace[]).map((p) => (
                <SheetChip key={p} label={p} selected={settings.pace === p} onClick={() => update({ pace: p })} />
              ))}
            </div>
          </>
        )}
        <SheetLabel top>wall</SheetLabel>
        <div className="flex gap-3.5">
          {(["ink", "stone", "paper", "blur"] as Wall[]).map((w) => (
            <button key={w} onClick={() => update({ wall: w })} aria-pressed={settings.wall === w} className="flex flex-col items-center gap-2">
              <span className={`h-[3.25rem] w-[3.25rem] rounded-[0.875rem] border-2 p-[0.1875rem] ${settings.wall === w ? "border-white" : "border-white/10"}`}>
                <span className="block h-full w-full rounded-[0.625rem]" style={{ background: w === "ink" ? "#111110" : w === "stone" ? "#F2F0EC" : w === "paper" ? "#FFFFFF" : "#6B6358" }} />
              </span>
              <span className={`text-[0.75rem] ${settings.wall === w ? "text-white" : "text-white/50"}`}>{w}</span>
            </button>
          ))}
        </div>
      </Sheet>
    </div>,
    document.body
  );
}

function shrink(r: { left: number; top: number; width: number; height: number }) {
  const w = r.width * 0.9;
  const h = r.height * 0.9;
  return { left: r.left + (r.width - w) / 2, top: r.top + (r.height - h) / 2 + 12, width: w, height: h };
}

function WallChip({ icon, label, onClick, fill, color }: { icon: IconName; label: string; onClick: () => void; fill: string; color: string }) {
  return (
    <button onClick={onClick} aria-label={label} className="flex h-11 w-11 items-center justify-center rounded-th-chip" style={{ background: fill, color }}>
      <Icon name={icon} size={21} />
    </button>
  );
}

function WallControl({ icon, label, onClick, color, large = false, disabled = false }: { icon: IconName; label: string; onClick: () => void; color: string; large?: boolean; disabled?: boolean }) {
  return (
    <button onClick={onClick} aria-label={label} disabled={disabled} className="flex h-[2.625rem] w-[2.625rem] items-center justify-center disabled:opacity-35" style={{ color }}>
      <Icon name={icon} size={large ? 23 : 19} strokeWidth={1.5} />
    </button>
  );
}

function SheetLabel({ children, top = false }: { children: string; top?: boolean }) {
  return <p className={`mb-2.5 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-white/40 ${top ? "mt-6" : ""}`}>{children}</p>;
}

function SheetChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-pressed={selected} className={`shrink-0 rounded-full px-4 py-2 text-[0.8125rem] font-medium ${selected ? "bg-white text-[#1A1A1A]" : "bg-white/10 text-white/75"}`}>
      {label}
    </button>
  );
}
