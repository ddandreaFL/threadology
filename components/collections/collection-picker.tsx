"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { addPieceToCollections, getPieceCollections } from "@/lib/actions/collections";

interface Collection {
  id: string;
  name: string;
}

interface CollectionPickerProps {
  pieceId: string;
  collections: Collection[];
  onClose: () => void;
}

export function CollectionPicker({ pieceId, collections, onClose }: CollectionPickerProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPieceCollections(pieceId).then((ids) => {
      setSelected(ids);
      setLoading(false);
    });
  }, [pieceId]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const save = async () => {
    setSaving(true);
    await addPieceToCollections(pieceId, selected);
    setSaving(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-sm rounded-2xl border border-[#E0D8CC] bg-[#FDFCFA] p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-serif text-lg text-gray-900">Add to Collection</h3>

        <div className="mt-4 space-y-2">
          {loading ? (
            <p className="py-4 text-center text-sm text-gray-400">Loading...</p>
          ) : collections.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">
              No collections yet. Create one first.
            </p>
          ) : (
            collections.map((collection) => (
              <button
                key={collection.id}
                onClick={() => toggle(collection.id)}
                className="flex w-full items-center justify-between rounded-lg border border-[#E0D8CC] bg-white px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                <span>{collection.name}</span>
                {selected.includes(collection.id) && (
                  <Check className="h-4 w-4 text-[#2D5A45]" />
                )}
              </button>
            ))
          )}
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-[#E0D8CC] bg-white px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || loading}
            className="flex-1 rounded-lg bg-[#2D5A45] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1E3D2F] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
