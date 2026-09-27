"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { createCollection, deleteCollection, renameCollection } from "@/lib/actions/collections";

export type OwnerCollectionCard = { id: string; name: string; count: number; previews: string[] };

/**
 * Your collections — the app's collections tab: a card per collection with
 * four previews, a + in the header, and each card's menu for rename and
 * delete. Sharing lives on the collection itself.
 */
export function OwnerCollections({ collections }: { collections: OwnerCollectionCard[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<OwnerCollectionCard | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // The tab bar's "add collection" arrives with ?new=1.
  useEffect(() => {
    if (params.get("new") === "1") setCreating(true);
  }, [params]);

  async function create() {
    if (!name.trim()) return;
    setBusy(true);
    const r = await createCollection({ name: name.trim() });
    setBusy(false);
    if ("error" in r && r.error) return setError(r.error);
    setCreating(false);
    setName("");
    router.replace("/collections");
    router.refresh();
  }
  async function rename() {
    if (!renaming) return;
    setBusy(true);
    const r = await renameCollection(renaming.id, name);
    setBusy(false);
    if ("error" in r && r.error) return setError(r.error);
    setRenaming(null);
    router.refresh();
  }
  async function remove(c: OwnerCollectionCard) {
    setMenu(null);
    if (!window.confirm(`Delete "${c.name}"? The pieces stay in your vault.`)) return;
    await deleteCollection(c.id);
    router.refresh();
  }

  const nameSheet = (open: boolean, title: string, onClose: () => void, onSubmit: () => void, cta: string) => (
    <Sheet open={open} title={title} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <label className="text-[11px] text-[#999999]">name</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="tbl tees"
          className="mt-1 w-full border-b border-[#E8E8E8] bg-transparent pb-2 pt-1 text-[16px] outline-none focus:border-th-ink"
        />
        {error && <p className="mt-3 text-[13px] text-th-danger">{error}</p>}
        <button disabled={busy || !name.trim()} className="mt-6 w-full rounded-th-pill bg-[#1A1A1A] py-3.5 text-[15px] font-medium text-white disabled:opacity-50">
          {busy ? "…" : cta}
        </button>
      </form>
    </Sheet>
  );

  return (
    <div className="font-th-sans">
      <ScreenHeader
        title="collections"
        subtitle={`${collections.length} ${collections.length === 1 ? "collection" : "collections"}`}
        actions={[{ icon: "plus", label: "new collection", onClick: () => (setName(""), setError(""), setCreating(true)) }]}
      />
      {collections.length === 0 ? (
        <p className="px-10 py-24 text-center text-[14px] text-th-muted">Group your pieces into collections.</p>
      ) : (
        <div className="grid gap-3 px-4 pb-8 lg:grid-cols-2 lg:gap-4 lg:px-8 xl:grid-cols-3">
          {collections.map((c) => (
            <div key={c.id} className="relative rounded-th-card border border-th-border p-4 transition-colors hover:border-th-muted/40">
              <Link href={`/collections/${c.id}`} className="block">
                <p className="truncate pr-10 text-[17px] font-semibold tracking-[-0.01em]">{c.name}</p>
                <p className="mt-0.5 font-th-mono text-[11px] uppercase tracking-[0.1em] text-th-muted">
                  <span className="text-th-accent">{c.count}</span> {c.count === 1 ? "piece" : "pieces"}
                </p>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map((i) =>
                    c.previews[i] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={c.previews[i]} alt="" className="aspect-square w-full rounded-xl object-cover" />
                    ) : (
                      <span key={i} className="aspect-square rounded-xl bg-th-surface" />
                    )
                  )}
                </div>
              </Link>
              <button
                aria-label="collection options"
                onClick={() => setMenu(menu === c.id ? null : c.id)}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-th-inline-chip text-th-muted hover:bg-th-chip"
              >
                <Icon name="overflow" size={17} />
              </button>
              {menu === c.id && (
                <div className="absolute right-3 top-12 z-10 w-44 overflow-hidden rounded-th-chip border border-th-border bg-white py-1 shadow-lg">
                  <Link href={`/collections/${c.id}`} className="block px-4 py-2.5 text-[14px] hover:bg-th-surface">
                    open & share
                  </Link>
                  <button onClick={() => (setMenu(null), setName(c.name), setError(""), setRenaming(c))} className="block w-full px-4 py-2.5 text-left text-[14px] hover:bg-th-surface">
                    rename
                  </button>
                  <button onClick={() => remove(c)} className="block w-full px-4 py-2.5 text-left text-[14px] text-th-danger hover:bg-th-surface">
                    delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {nameSheet(creating, "new collection", () => (setCreating(false), router.replace("/collections")), create, "create collection")}
      {nameSheet(!!renaming, "rename collection", () => setRenaming(null), rename, "save")}
    </div>
  );
}
