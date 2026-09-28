"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ChipRow, Chip } from "@/components/ui/Chip";
import { addPiece } from "@/lib/actions/pieces";
import { deleteImage } from "@/lib/storage";
import {
  CONDITION_OPTIONS,
  SEASON_OPTIONS,
  SIZE_OPTIONS_DEFAULT,
  SIZE_OPTIONS_FOOTWEAR,
  SUBCATEGORIES,
  TYPE_OPTIONS,
  packType,
} from "./options";
import { Field, MadeInPicker, PhotoPicker, YearWheel, inputClass, uploadPhotos, type PhotoItem } from "./fields";
import { CollectionChecklist, EditorBody, EditorFooter, parseMoney } from "./editor";

const STEPS: { title: string; subtitle?: string }[] = [
  { title: "add photos", subtitle: "up to 12 photos" },
  { title: "who made it?", subtitle: "brand or designer" },
  { title: "what is it?", subtitle: "pick a category" },
  { title: "when?", subtitle: "optional" },
  { title: "size & condition", subtitle: "optional" },
  { title: "give it a voice", subtitle: "optional" },
  { title: "review" },
];

/**
 * Add a piece — the app's seven steps (threadology-native/app/(main)/vault/
 * add.tsx): photos, brand, type, when, size and condition, name and story,
 * then a review that saves. Photos, brand and type are required; the rest
 * can wait. Drafts are the app's alone — a browser can't keep the photos.
 */
export function AddPieceFlow({
  userId,
  topBrands,
  collections,
}: {
  userId: string;
  topBrands: string[];
  collections: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [sub, setSub] = useState<string | null>(null);
  const [year, setYear] = useState("");
  const [season, setSeason] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [condition, setCondition] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [story, setStory] = useState("");
  const [madeIn, setMadeIn] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [inCollections, setInCollections] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ok = [photos.length > 0, brand.trim().length > 0, category !== null];
  const canProceed = (s: number) => (s <= 3 ? ok[s - 1] : true);
  const dirty = photos.length > 0 || brand.trim() !== "" || category !== null;
  const meta = STEPS[step - 1];

  function leave() {
    if (dirty && !window.confirm("Leave this piece? What you've entered won't be kept.")) return;
    router.push("/vault");
  }

  async function save() {
    if (!ok.every(Boolean) || !category) return;
    setSaving(true);
    setError(null);
    let urls: string[] = [];
    try {
      urls = await uploadPhotos(photos, userId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "A photo didn't upload. Try again.");
      setSaving(false);
      return;
    }
    const result = await addPiece(
      {
        brand: brand.trim(),
        type: packType(category, sub),
        name: name.trim() || null,
        year: year.trim() || null,
        season,
        size,
        condition,
        made_in: madeIn,
        story: story.trim() || null,
        photos: urls,
      },
      { estimatedValue: parseMoney(value), collectionIds: inCollections }
    );
    if ("error" in result) {
      await Promise.all(urls.map((u) => deleteImage(u).catch(() => {})));
      setError(result.error);
      setSaving(false);
      return;
    }
    router.replace(`/pieces/${result.id}`);
    router.refresh();
  }

  const sizes = category === "Footwear" ? SIZE_OPTIONS_FOOTWEAR : SIZE_OPTIONS_DEFAULT;
  const summary: [string, string | null, number][] = [
    ["photos", photos.length ? `${photos.length}` : null, 1],
    ["brand", brand.trim() || null, 2],
    ["type", category ? packType(category, sub) : null, 3],
    ["year", year || null, 4],
    ["season", season, 4],
    ["size", size, 5],
    ["condition", condition, 5],
    ["name", name.trim() || null, 6],
    ["story", story.trim() || null, 6],
  ];

  return (
    <div className="min-h-full">
      <ScreenHeader
        title={meta.title}
        subtitle={meta.subtitle}
        {...(step === 1 ? { close: { onClick: leave } } : { back: { onClick: () => setStep(step - 1) } })}
        trailing={<span className="pt-3 font-th-label font-light text-[11px] text-th-muted">{step}/{STEPS.length}</span>}
      />
      <div className="mx-auto mb-5 flex max-w-xl gap-1 px-5">
        {STEPS.map((_, i) => (
          <span key={i} className={`h-[3px] flex-1 rounded-full ${i < step ? "bg-[#1A1A1A]" : "bg-[#F0F0F0]"}`} />
        ))}
      </div>

      <EditorBody>
        {step === 1 && <PhotoPicker photos={photos} onChange={setPhotos} />}

        {step === 2 && (
          <>
            <input autoFocus value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Engineered Garments" className={`${inputClass} text-[22px]`} onKeyDown={(e) => e.key === "Enter" && ok[1] && setStep(3)} />
            {topBrands.length > 0 && (
              <Field label="recent">
                <div className="flex flex-wrap gap-2">
                  {topBrands.map((b) => (
                    <Chip key={b} label={b} selected={brand.trim() === b} onClick={() => setBrand(b)} />
                  ))}
                </div>
              </Field>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {TYPE_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    if (category !== t.id) setSub(null);
                    setCategory(t.id);
                  }}
                  className={`flex flex-col items-start gap-3 rounded-2xl border px-4 py-4 text-left ${category === t.id ? "border-[#1A1A1A] bg-[#1A1A1A] text-white" : "border-[#EBEBEB] text-th-ink hover:border-th-ink"}`}
                >
                  <span className="text-[26px]">{t.icon}</span>
                  <span className="text-[15px] font-medium">{t.label}</span>
                </button>
              ))}
            </div>
            {category && (SUBCATEGORIES[category] ?? []).length > 0 && (
              <Field label="more specific (optional)">
                <ChipRow options={SUBCATEGORIES[category]} value={sub} onChange={setSub} labels={Object.fromEntries(SUBCATEGORIES[category].map((s) => [s, s.toLowerCase()]))} />
              </Field>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <YearWheel value={year} onChange={setYear} />
            <Field label="season">
              <ChipRow options={SEASON_OPTIONS} value={season} onChange={setSeason} />
            </Field>
          </>
        )}

        {step === 5 && (
          <>
            <Field label="size">
              <ChipRow options={sizes} value={size} onChange={setSize} />
            </Field>
            <Field label="condition">
              <ChipRow options={CONDITION_OPTIONS} value={condition} onChange={setCondition} />
            </Field>
          </>
        )}

        {step === 6 && (
          <>
            <Field label="name">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="what you call it" className={inputClass} />
            </Field>
            <Field label="story">
              <textarea value={story} onChange={(e) => setStory(e.target.value)} rows={5} placeholder="where it came from, why it matters" className={`${inputClass} resize-none`} />
            </Field>
          </>
        )}

        {step === 7 && (
          <>
            <div className="flex flex-col divide-y divide-[#F0F0F0] rounded-2xl border border-[#EBEBEB]">
              {summary.map(([label, v, s]) => (
                <button key={label} type="button" onClick={() => setStep(s)} className="flex items-center justify-between gap-4 px-4 py-3 text-left">
                  <span className="text-[12px] text-[#999999]">{label}</span>
                  <span className={`truncate text-[14px] ${v ? "text-th-ink" : "text-[#C8C8C8]"}`}>{v ?? "add"}</span>
                </button>
              ))}
            </div>
            <Field label="made in">
              <MadeInPicker value={madeIn} onChange={setMadeIn} />
            </Field>
            <Field label="estimated value · only you see this">
              <input inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="$0" className={inputClass} />
            </Field>
            <Field label="collections">
              <CollectionChecklist collections={collections} selected={inCollections} onChange={setInCollections} />
            </Field>
            {error && <p className="text-[13px] text-th-danger">{error}</p>}
          </>
        )}
      </EditorBody>

      <EditorFooter
        label={step === STEPS.length ? "save to vault" : "next  →"}
        enabled={step === STEPS.length ? ok.every(Boolean) : canProceed(step)}
        busy={saving}
        onClick={step === STEPS.length ? save : () => setStep(step + 1)}
      />
    </div>
  );
}
