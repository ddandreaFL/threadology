"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "@/components/profile/kit";
import { updateProfile } from "@/lib/actions/profile";
import { uploadImage } from "@/lib/storage";
import { compressImage } from "@/lib/compress";

const BIO_LIMIT = 160;

/**
 * Edit profile — its own screen, as in the app: photo and bio, the username
 * shown but fixed. Save is live only once something changed, and goes back
 * to the profile when it lands.
 */
export function EditProfile({
  userId,
  username,
  bio: initialBio,
  avatarUrl: initialAvatar,
}: {
  userId: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const [bio, setBio] = useState(initialBio ?? "");
  const [avatar, setAvatar] = useState(initialAvatar ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const file = useRef<HTMLInputElement>(null);
  const dirty = bio.trim() !== (initialBio ?? "").trim() || avatar !== (initialAvatar ?? "");

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setError(null);
    setUploading(true);
    try {
      setAvatar(await uploadImage(await compressImage(f), userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function save() {
    setError(null);
    const fd = new FormData();
    fd.set("bio", bio);
    fd.set("avatar_url", avatar);
    start(async () => {
      try {
        await updateProfile(fd);
        router.push("/profile");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed.");
      }
    });
  }

  return (
    <div className="font-th-sans">
      <ScreenHeader title="edit profile" back={{ href: "/profile" }} />

      <div className="th-page pb-10">
        <div className="flex flex-col items-center gap-3 pb-7 pt-3">
          <button type="button" onClick={() => file.current?.click()} disabled={uploading} aria-label="change photo" className="relative rounded-full">
            <Avatar src={avatar || null} username={username} size={112} />
            {uploading && <span className="absolute inset-0 rounded-full bg-white/60" />}
          </button>
          <button type="button" onClick={() => file.current?.click()} disabled={uploading} className="text-[0.8125rem] font-medium leading-[1.0625rem] text-th-accent hover:underline">
            {uploading ? "uploading…" : "change photo"}
          </button>
          <input ref={file} type="file" accept="image/*" hidden onChange={pick} />
        </div>

        <div className="border-t border-th-border">
          <div className="border-b border-th-border pb-3.5 pt-3">
            <p className="th-label">username</p>
            <div className="mt-1 flex items-center justify-between text-th-muted">
              <span className="text-[1rem] font-medium leading-[1.375rem]">@{username}</span>
              <span className="flex items-center gap-1 text-[0.8125rem] leading-[1.0625rem]">
                <Icon name="lock" size={14} /> can&apos;t be changed
              </span>
            </div>
          </div>
          <div className="border-b border-th-border pb-3.5 pt-3">
            <div className="flex justify-between">
              <label htmlFor="bio" className="th-label">
                bio
              </label>
              <span className="th-label tabular-nums">
                {bio.length} / {BIO_LIMIT}
              </span>
            </div>
            <textarea
              id="bio"
              value={bio}
              maxLength={BIO_LIMIT}
              rows={2}
              onChange={(e) => setBio(e.target.value.slice(0, BIO_LIMIT))}
              placeholder="a short line about your style"
              className="mt-1.5 min-h-12 w-full resize-none bg-transparent text-[1rem] leading-6 outline-none placeholder:text-th-muted/60"
            />
          </div>
        </div>

        <p className="mt-3 text-[0.8125rem] leading-[1.0625rem] text-th-muted">Shown on your profile only. Shared vault links don&apos;t show your photo or bio.</p>
        {error && <p className="mt-3 text-[0.8125rem] text-th-danger">{error}</p>}

        <button
          type="button"
          onClick={save}
          disabled={!dirty || pending || uploading}
          className="mt-7 flex h-[3.375rem] w-full items-center justify-center gap-2 rounded-th-fab bg-th-accent text-[1rem] font-medium text-white transition-opacity hover:bg-th-accent-pressed disabled:opacity-40"
        >
          {pending ? "saving…" : "save changes →"}
        </button>
      </div>
    </div>
  );
}
