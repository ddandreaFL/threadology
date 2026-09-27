"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ChipRow } from "@/components/ui/Chip";
import { updatePiece, deletePiece } from "@/lib/actions/pieces";
import { addPieceToCollections } from "@/lib/actions/collections";
import { deleteImage } from "@/lib/storage";
import { CONDITION_OPTIONS, SEASON_OPTIONS, SIZE_OPTIONS_DEFAULT, SIZE_OPTIONS_FOOTWEAR, parseType } from "./options";
import { Field, MadeInPicker, PhotoPicker, TypePicker, YearWheel, inputClass, uploadPhotos, type PhotoItem } from "./fields";
import { CollectionChecklist, EditorBody, EditorFooter, Toggle, parseMoney } from "./editor";

export type EditablePiece = {
  id: string;
  brand: string;
  type: string;
  name: string | null;
  year: string | null;
  season: string | null;
  size: string | null;
  condition: string | null;
  made_in: string | null;
  story: string | null;
  photos: string[];
  is_private: boolean;
  estimatedValue: number | null;
};

/**
 * Edit a piece — every field the add flow sets, on one screen, as in the app
 * (threadology-native/app/(main)/vault/edit/[id].tsx), plus privacy: a
 * private piece stays out of every shared link.
 */
export function EditPieceForm({
  piece,
  userId,
  collections,
  memberOf,
}: {
  piece: EditablePiece;
  userId: string;
  collections: { id: string; name: string }[];
  memberOf: string[];
}) {
  const router = useRouter();
  const [photos, setPhotos] = useState<PhotoItem[]>(piece.photos.map((url) => ({ url })));
  const [brand, setBrand] = useState(piece.brand);
  const [type, setType] = useState(piece.type);
  const [name, setName] = useState(piece.name ?? "");
  const [year, setYear] = useState(piece.year ?? "");
  const [season, setSeason] = useState(piece.season);
  const [size, setSize] = useState(piece.size);
  const [condition, setCondition] = useState(piece.condition);
  const [madeIn, setMadeIn] = useState(piece.made_in);
  const [story, setStory] = useState(piece.story ?? "");
  const [isPrivate, setIsPrivate] = useState(piece.is_private);
  const [value, setValue] = useState(piece.estimatedValue !== null ? String(piece.estimatedValue) : "");
  const [inCollections, setInCollections] = useState(memberOf);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = photos.length > 0 && brand.trim() !== "" && type.trim() !== "";
  const sizes = parseType(type).category === "Footwear" ? SIZE_OPTIONS_FOOTWEAR : SIZE_OPTIONS_DEFAULT;

  async function save() {
    if (!valid) return;
    setSaving(true);
    setError(null);
    let urls: string[];
    try {
      urls = await uploadPhotos(photos, userId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "A photo didn't upload. Try again.");
      setSaving(false);
      return;
    }
    const result = await updatePiece(
      piece.id,
      {
        brand: brand.trim(),
        type: type.trim(),
        name: name.trim() || null,
        year: year.trim() || null,
        season,
        size,
        condition,
        made_in: madeIn,
        story: story.trim() || null,
        photos: urls,
        is_private: isPrivate,
      },
      parseMoney(value)
    );
    if ("error" in result) {
      setError(result.error);
      setSaving(false);
      return;
    }
    const before = [...memberOf].sort().join();
    if ([...inCollections].sort().join() !== before) await addPieceToCollections(piece.id, inCollections);
    // Photos removed in this edit leave storage once the piece no longer
    // points at them.
    const dropped = piece.photos.filter((u) => !urls.includes(u));
    await Promise.all(dropped.map((u) => deleteImage(u).catch(() => {})));
    router.replace(`/pieces/${piece.id}`);
    router.refresh();
  }

  async function remove() {
    if (!window.confirm(`Delete "${piece.name ?? piece.type}"? This can't be undone.`)) return;
    setSaving(true);
    await deletePiece(piece.id);
    router.replace("/vault");
    router.refresh();
  }

  return (
    <div>
      <ScreenHeader title="edit piece" subtitle={piece.brand} subtitleStyle="brandLine" close={{ href: `/pieces/${piece.id}` }} />
      <EditorBody>
        <PhotoPicker photos={photos} onChange={setPhotos} />
        <Field label="brand">
          <input value={brand} onChange={(e) => setBrand(e.target.value)} className={inputClass} />
        </Field>
        <Field label="name">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="what you call it" className={inputClass} />
        </Field>
        <Field label="type">
          <TypePicker value={type} onChange={setType} />
        </Field>
        <YearWheel value={year} onChange={setYear} />
        <Field label="season">
          <ChipRow options={SEASON_OPTIONS} value={season} onChange={setSeason} />
        </Field>
        <Field label="size">
          <ChipRow options={sizes} value={size} onChange={setSize} />
        </Field>
        <Field label="condition">
          <ChipRow options={CONDITION_OPTIONS} value={condition} onChange={setCondition} />
        </Field>
        <Field label="made in">
          <MadeInPicker value={madeIn} onChange={setMadeIn} />
        </Field>
        <Field label="story">
          <textarea value={story} onChange={(e) => setStory(e.target.value)} rows={5} placeholder="where it came from, why it matters" className={`${inputClass} resize-none`} />
        </Field>
        <Field label="estimated value · only you see this">
          <input inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="$0" className={inputClass} />
        </Field>
        <Field label="collections">
          <CollectionChecklist collections={collections} selected={inCollections} onChange={setInCollections} />
        </Field>
        <Toggle label="private" detail="hidden from every shared link, even ones already sent" on={isPrivate} onChange={setIsPrivate} />
        {error && <p className="text-[13px] text-th-danger">{error}</p>}
        <button type="button" onClick={remove} disabled={saving} className="self-start text-[14px] font-medium text-th-danger">
          delete piece
        </button>
      </EditorBody>
      <EditorFooter label="save" enabled={valid} busy={saving} onClick={save} />
    </div>
  );
}
