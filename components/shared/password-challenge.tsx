"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { unlockShare } from "@/lib/actions/unlock";

/**
 * The challenge replaces the page. Nothing about the container, the owner or
 * the count renders behind it, and the unfurl carries nothing either — the
 * card route treats a password-gated link the same as a dead one.
 *
 * The password goes to the server in a POST, never into a URL. Right, and
 * the page refreshes into the ordinary shared view.
 */
export function PasswordChallenge({
  fn,
  token,
}: {
  fn: "shared_vault" | "shared_collection" | "shared_fit" | "shared_piece";
  token: string;
  kind?: "vault" | "collection" | "fit" | "piece";
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [wrong, setWrong] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim() || busy) return;
    setBusy(true);
    setWrong(false);
    const { ok } = await unlockShare(fn, token, password);
    if (!ok) {
      setBusy(false);
      setWrong(true);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 font-th-sans">
      <p className="text-[72px] leading-[72px] text-[#EBEBEB]" aria-hidden>
        ✦
      </p>
      <p className="mt-6 text-[17px] font-medium text-th-ink">This link needs a password.</p>
      <p className="mt-1.5 text-[13px] text-th-muted">Ask whoever sent it.</p>
      <form onSubmit={submit} className="mt-7 w-full max-w-xs">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          autoFocus
          className="w-full border-b border-[#E8E8E8] bg-transparent pb-2.5 text-center text-[17px] text-th-ink outline-none placeholder:text-[#C8C8C8] focus:border-th-ink"
        />
        {wrong && <p className="mt-3 text-center text-[13px] text-th-danger">That password does not open this link.</p>}
        <button
          type="submit"
          disabled={!password.trim() || busy}
          className="mt-6 w-full rounded-[30px] bg-[#1A1A1A] py-3.5 text-[15px] font-medium text-white disabled:bg-[#D6D6D6]"
        >
          {busy ? "opening…" : "open"}
        </button>
      </form>
    </div>
  );
}
