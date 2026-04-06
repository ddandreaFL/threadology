"use client";

import { useRef, useState, useTransition } from "react";
import { updateProfile } from "@/lib/actions/profile";
import { uploadImage } from "@/lib/storage";
import { compressImage } from "@/lib/compress";

interface ProfileSettingsFormProps {
  userId: string;
  currentBio: string | null;
  currentAvatarUrl: string | null;
  username: string;
}

export function ProfileSettingsForm({
  userId,
  currentBio,
  currentAvatarUrl,
  username,
}: ProfileSettingsFormProps) {
  const [bio, setBio] = useState(currentBio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl ?? "");
  const [avatarPreview, setAvatarPreview] = useState(currentAvatarUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const initial = username[0].toUpperCase();

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const url = await uploadImage(compressed, userId);
      setAvatarUrl(url);
      setAvatarPreview(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("bio", bio);
    fd.set("avatar_url", avatarUrl);
    startTransition(async () => {
      try {
        await updateProfile(fd);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar */}
      <div>
        <p className="font-mono-display text-[10px] uppercase tracking-widest text-gray-400">
          Avatar
        </p>
        <div className="mt-3 flex items-center gap-4">
          {/* Preview */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative shrink-0 focus:outline-none"
            title="Change avatar"
          >
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarPreview}
                alt={username}
                className="h-16 w-16 rounded-full border border-[#E0D8CC] object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#E0D8CC] bg-[#2D5A45]/10">
                <span className="font-serif text-xl text-[#2D5A45]">
                  {initial}
                </span>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70">
                <svg
                  className="h-5 w-5 animate-spin text-[#2D5A45]"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
              </div>
            )}
          </button>

          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="rounded-lg border border-[#E0D8CC] bg-[#FDFCFA] px-3 py-1.5 font-mono-display text-xs text-gray-600 transition-colors hover:bg-[#F5F1EA] disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Change photo"}
            </button>
            <p className="mt-1 font-mono-display text-[10px] text-gray-400">
              JPEG, PNG or WebP · max 20 MB
            </p>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>

      {/* Bio */}
      <div>
        <label
          htmlFor="bio"
          className="font-mono-display text-[10px] uppercase tracking-widest text-gray-400"
        >
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={160}
          rows={3}
          placeholder="A short line about your style…"
          className="mt-2 w-full resize-none rounded-xl border border-[#E0D8CC] bg-[#FDFCFA] px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#2D5A45] focus:ring-1 focus:ring-[#2D5A45]"
        />
        <p className="mt-1 text-right font-mono-display text-[10px] text-gray-400">
          {bio.length}/160
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || uploading}
        className="w-full rounded-xl bg-[#2D5A45] py-3 text-sm font-medium text-white transition-colors hover:bg-[#1E3D2F] disabled:opacity-50"
      >
        {isPending ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
      </button>
    </form>
  );
}
