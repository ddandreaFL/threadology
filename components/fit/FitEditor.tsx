"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Sheet } from "@/components/ui/Sheet";
import { createFit, updateFit, deleteFit } from "@/lib/actions/fits";
import { deleteImage } from "@/lib/storage";
import { Field, PhotoPicker, inputClass, uploadPhotos, useFocusField, type PhotoItem } from "@/components/piece/fields";
import { EditorBody, EditorFooter } from "@/components/piece/editor";

export type FitPieceOption = { id: string; brand: string; type: string; name: string | null; photo: string | null };
export type EditableFit = { id: string; title: string | null; caption: string | null; location: string | null; date: string; photos: string[]; pieceIds: string[] };

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Log a fit, or edit one — the app's fit editor (threadology-native/app/
 * (main)/fits/new.tsx and fits/edit/[id].tsx): the photo, a title, the date,
 * the pieces worn in order, and a caption.
 */
export function FitEditor({ userId, pieces, fit }: { userId: string; pieces: FitPieceOption[]; fit?: EditableFit }) {
  const router = useRouter();
  const [photos, setPhotos] = useState<PhotoItem[]>((fit?.photos ?? []).map((url) => ({ url })));
  const [title, setTitle] = useState(fit?.title ?? "");
  const [date, setDate] = useState(fit?.date ?? today());
  const [caption, setCaption] = useState(fit?.caption ?? "");
  const [location, setLocation] = useState(fit?.location ?? "");
  useFocusField();
  const [worn, setWorn] = useState<string[]>(fit?.pieceIds ?? []);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const byId = new Map(pieces.map((p) => [p.id, p]));
  const valid = photos.length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date);
  const exit = fit ? `/fits/${fit.id}` : "/fits";

  async function save() {
    if (!valid) return;
    setSaving(true);
    setError(null);
    let urls: string[];
    try {
      urls = await uploadPhotos(photos, userId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The photo didn't upload. Try again.");
      setSaving(false);
      return;
    }
    const data = { photos: urls, pieceIds: worn, title: title.trim() || null, caption: caption.trim() || null, location: location.trim() || null, date };
    const result = fit ? await updateFit(fit.id, data) : await createFit(data);
    if ("error" in result) {
      const fresh = urls.filter((u) => !fit?.photos.includes(u));
      await Promise.all(fresh.map((u) => deleteImage(u).catch(() => {})));
      setError(result.error);
      setSaving(false);
      return;
    }
    if (fit) {
      const dropped = fit.photos.filter((u) => !urls.includes(u));
      await Promise.all(dropped.map((u) => deleteImage(u).catch(() => {})));
    }
    router.replace("id" in result ? `/fits/${result.id}` : exit);
    router.refresh();
  }

  async function remove() {
    if (!fit || !window.confirm("Delete this fit? This can't be undone.")) return;
    setSaving(true);
    const result = await deleteFit(fit.id);
    if ("error" in result) {
      setError(result.error);
      setSaving(false);
      return;
    }
    await Promise.all(fit.photos.map((u) => deleteImage(u).catch(() => {})));
    router.replace("/fits");
    router.refresh();
  }

  return (
    <div>
      <ScreenHeader title={fit ? "edit fit" : "log a fit"} close={{ href: exit }} />
      <EditorBody>
        <PhotoPicker photos={photos} onChange={setPhotos} max={Math.max(1, fit?.photos.length ?? 0)} />
        <Field label="title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="quiet morning" className={inputClass} />
        </Field>
        <Field label="date" name="date">
          <input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} className={`${inputClass} text-left [&::-webkit-date-and-time-value]:text-left`} />
        </Field>
        <Field label="pieces">
          <div className="flex flex-col gap-2">
            {worn.map((id, n) => {
              const p = byId.get(id);
              if (!p) return null;
              return (
                <div key={id} className="flex items-center gap-3">
                  <span className="w-4 font-th-label font-light text-[11px] text-th-muted">{n + 1}</span>
                  {p.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photo} alt="" className="h-12 w-9 rounded-md object-cover" />
                  ) : (
                    <span className="h-12 w-9 rounded-md bg-[#F0F0F0]" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-th-label font-light text-[10px] uppercase tracking-[0.1em] text-th-muted">{p.brand}</span>
                    <span className="block truncate text-[14px]">{p.name ?? p.type}</span>
                  </span>
                  <button type="button" onClick={() => setWorn(worn.filter((x) => x !== id))} className="text-[12px] text-[#999999]">
                    remove
                  </button>
                </div>
              );
            })}
            <button type="button" onClick={() => setPicking(true)} className="flex items-center justify-between rounded-2xl border border-[#EBEBEB] px-4 py-3 text-left text-[14px] font-semibold">
              {worn.length ? "change pieces" : "choose pieces"}
              <span className="text-[16px] text-[#CCCCCC]">›</span>
            </button>
          </div>
        </Field>
        <Field label="where" name="location">
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="neighborhood, city, venue" className={inputClass} />
        </Field>
        <Field label="caption" name="caption">
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={4} placeholder="something small about today" className={`${inputClass} resize-none`} />
        </Field>
        {error && <p className="text-[13px] text-th-danger">{error}</p>}
        {fit && (
          <button type="button" onClick={remove} disabled={saving} className="self-start text-[14px] font-medium text-th-danger">
            delete fit
          </button>
        )}
      </EditorBody>
      <EditorFooter label="save fit" enabled={valid} busy={saving} onClick={save} />

      <Sheet open={picking} onClose={() => setPicking(false)} title="what you wore">
        {pieces.length === 0 ? (
          <p className="py-6 text-center text-[14px] text-th-muted">your vault is empty — add a piece first.</p>
        ) : (
          <div className="grid max-h-[60vh] grid-cols-3 gap-2 overflow-y-auto pb-2 sm:grid-cols-4">
            {pieces.map((p) => {
              const at = worn.indexOf(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setWorn(at === -1 ? [...worn, p.id] : worn.filter((x) => x !== p.id))}
                  className={`relative aspect-[3/4] overflow-hidden rounded-xl border-2 ${at === -1 ? "border-transparent" : "border-[#1A1A1A]"}`}
                >
                  {p.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photo} alt={p.name ?? p.type} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center bg-[#F0F0F0] text-[11px] text-th-muted">{p.brand}</span>
                  )}
                  {at !== -1 && (
                    <span className="absolute right-1.5 top-1.5 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#1A1A1A] text-[11px] font-bold text-white">{at + 1}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        <button type="button" onClick={() => setPicking(false)} className="mt-3 w-full rounded-[30px] bg-[#1A1A1A] py-3.5 text-[13px] font-semibold uppercase tracking-[0.07em] text-white">
          done{worn.length ? ` · ${worn.length}` : ""}
        </button>
      </Sheet>
    </div>
  );
}
