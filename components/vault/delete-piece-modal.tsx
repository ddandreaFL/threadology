"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deletePiece } from "@/lib/actions/pieces";

interface DeletePieceModalProps {
  pieceId: string;
  pieceName: string;
}

export function DeletePieceModal({ pieceId, pieceName }: DeletePieceModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      await deletePiece(pieceId);
      router.push("/vault");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete piece.");
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-red-200 bg-[#FDFCFA] px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
      >
        Delete
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => !deleting && setOpen(false)}
          />

          {/* Dialog */}
          <div className="animate-dropdown-enter relative w-full max-w-sm rounded-2xl border border-[#E0D8CC] bg-[#FDFCFA] p-6 shadow-xl">
            <h2 className="text-lg text-gray-900">Delete piece?</h2>
            <p className="mt-2 text-sm text-gray-500">
              <span className="font-medium text-gray-700">{pieceName}</span> will be permanently removed from your vault. This can&apos;t be undone.
            </p>

            {error && (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={deleting}
                className="flex-1 rounded-lg border border-[#E0D8CC] bg-white px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
