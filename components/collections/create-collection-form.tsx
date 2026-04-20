"use client";

import { useState } from "react";
import { createCollection } from "@/lib/actions/collections";

interface CreateCollectionFormProps {
  disabled: boolean;
}

export function CreateCollectionForm({ disabled }: CreateCollectionFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    const result = await createCollection({ name: name.trim(), description: description.trim() || undefined });
    setSaving(false);
    if (result.error) {
      setError(result.error);
    } else {
      setName("");
      setDescription("");
      setOpen(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        className="mb-6 w-full rounded-xl border border-dashed border-[#C8BFB0] bg-[#FDFCFA] py-3 text-sm text-gray-400 transition-colors hover:border-[#2D5A45] hover:text-[#2D5A45] disabled:cursor-not-allowed disabled:opacity-50"
      >
        + New collection
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-[#E0D8CC] bg-white p-4">
      <p className="mb-3 font-mono-display text-[10px] uppercase tracking-widest text-gray-400">
        New Collection
      </p>
      <input
        autoFocus
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Collection name"
        className="w-full rounded-lg border border-[#E0D8CC] bg-[#FDFCFA] px-3 py-2 text-sm focus:border-[#2D5A45] focus:outline-none"
      />
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        className="mt-2 w-full rounded-lg border border-[#E0D8CC] bg-[#FDFCFA] px-3 py-2 text-sm focus:border-[#2D5A45] focus:outline-none"
      />
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null); }}
          className="flex-1 rounded-lg border border-[#E0D8CC] py-2 text-sm text-gray-600 hover:bg-[#F5F1EA]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="flex-1 rounded-lg bg-[#2D5A45] py-2 text-sm font-medium text-white hover:bg-[#1E3D2F] disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create"}
        </button>
      </div>
    </form>
  );
}
