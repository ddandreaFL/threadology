"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { updateProfile } from "@/lib/actions/profile";
import { signOut } from "@/lib/actions/auth";
import { uploadImage } from "@/lib/storage";
import { compressImage } from "@/lib/compress";
import { APP_STORE_URL } from "@/lib/app-store";

const LEGAL = [
  { label: "privacy policy", href: "/privacy" },
  { label: "terms of service", href: "/terms" },
  { label: "trust & security", href: "/security" },
];

/**
 * Settings — the app's (threadology-native/app/(main)/settings.tsx): sign
 * out and the legal pages, with the profile editor (photo and bio) on top,
 * since the web has no separate edit-profile screen.
 */
export function SettingsView({
  userId,
  username,
  email,
  bio: initialBio,
  avatarUrl: initialAvatar,
}: {
  userId: string;
  username: string;
  email: string | null;
  bio: string | null;
  avatarUrl: string | null;
}) {
  const [bio, setBio] = useState(initialBio ?? "");
  const [avatar, setAvatar] = useState(initialAvatar ?? "");
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const file = useRef<HTMLInputElement>(null);
  const dirty = bio !== (initialBio ?? "") || avatar !== (initialAvatar ?? "");

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
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed.");
      }
    });
  }

  const section = "font-th-mono text-[11px] uppercase tracking-[0.1em] text-th-muted";

  return (
    <div className="font-th-sans">
      <ScreenHeader title="settings" subtitle={[`@${username}`, email].filter(Boolean).join(" · ")} back={{ href: "/profile" }} />
      <div className="mx-auto flex max-w-xl flex-col gap-9 px-5 pb-10 pt-3">
        <section>
          <h2 className={section}>profile</h2>
          <div className="mt-4 flex items-center gap-4">
            <button type="button" onClick={() => file.current?.click()} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-th-chip" aria-label="change photo">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-[22px] font-semibold text-th-avatar-glyph">{username[0]?.toUpperCase()}</span>
              )}
              {uploading && <span className="absolute inset-0 bg-white/70" />}
            </button>
            <button type="button" onClick={() => file.current?.click()} disabled={uploading} className="rounded-full bg-th-chip px-4 py-2 text-[13px] font-medium hover:bg-th-chip-pressed">
              {uploading ? "uploading…" : avatar ? "change photo" : "add photo"}
            </button>
            <input ref={file} type="file" accept="image/*" hidden onChange={pick} />
          </div>
          <label className="mt-6 block text-[11px] text-[#999999]" htmlFor="bio">
            bio
          </label>
          <textarea
            id="bio"
            value={bio}
            maxLength={160}
            rows={3}
            onChange={(e) => setBio(e.target.value)}
            placeholder="a line about you and your wardrobe"
            className="mt-1 w-full resize-none border-b border-[#E8E8E8] bg-transparent pb-2 text-[16px] outline-none placeholder:text-[#C8C8C8] focus:border-th-ink"
          />
          <p className="text-right font-th-mono text-[10px] text-[#BBBBBB]">{bio.length}/160</p>
          {error && <p className="mt-2 text-[13px] text-th-danger">{error}</p>}
          <button
            type="button"
            onClick={save}
            disabled={!dirty || pending || uploading}
            className="mt-4 w-full rounded-[30px] bg-[#1A1A1A] py-3.5 text-[15px] font-medium text-white disabled:opacity-40"
          >
            {pending ? "saving…" : saved ? "saved ✓" : "save profile"}
          </button>
        </section>

        <section>
          <h2 className={section}>account</h2>
          <div className="mt-2 divide-y divide-th-border border-y border-th-border">
            <a href={APP_STORE_URL} className="flex items-center justify-between py-4 text-[14px]">
              get the iPhone app <span className="text-[18px] text-[#CCCCCC]">›</span>
            </a>
            <form action={signOut}>
              <button className="w-full py-4 text-left text-[14px] text-th-danger">sign out</button>
            </form>
          </div>
        </section>

        <section>
          <h2 className={section}>legal</h2>
          <div className="mt-2 divide-y divide-th-border border-y border-th-border">
            {LEGAL.map((l) => (
              <Link key={l.href} href={l.href} className="flex items-center justify-between py-4 text-[14px] text-[#555555]">
                {l.label} <span className="text-[18px] text-[#CCCCCC]">›</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
