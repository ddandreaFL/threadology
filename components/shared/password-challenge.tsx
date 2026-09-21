"use client";

import { useState } from "react";
import { SharedPieces, type SharedPiece } from "@/components/shared/shared-pieces";
import { SharedHeader } from "@/components/shared/shared-header";

/**
 * The challenge replaces the page. Nothing about the container, the owner or
 * the count renders behind it, and the unfurl carries nothing either — the
 * card route treats a password-gated link the same as a dead one.
 *
 * Unlocking happens here rather than on the server so the password never
 * becomes part of a URL that could be shared or logged.
 */
export function PasswordChallenge({
  fn,
  token,
  kind,
}: {
  fn: "shared_vault" | "shared_collection";
  token: string;
  kind: "vault" | "collection";
}) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [data, setData] = useState<{
    owner: { username: string; avatar_url: string | null; bio: string | null };
    collection?: { name: string };
    pieces: SharedPiece[];
  } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim() || busy) return;
    setBusy(true);
    setWrong(false);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/${fn}`,
      {
        method: "POST",
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ p_token: token, p_password: password.trim() }),
      }
    );
    const json = res.ok ? await res.json() : null;
    setBusy(false);

    if (!json || json.password_required) {
      setWrong(true);
      return;
    }
    setData(json);
  }

  if (data) {
    return (
      <>
        <SharedHeader
          owner={data.owner}
          title={data.collection?.name ?? "vault"}
          count={data.pieces.length}
          kind={kind}
        />
        <SharedPieces pieces={data.pieces} />
      </>
    );
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6">
      <p className="text-[17px] text-[#1B1A17]">This link needs a password.</p>
      <form onSubmit={submit} className="mt-7 w-full max-w-xs">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          autoFocus
          className="w-full border-b border-[#E8E5DE] bg-transparent pb-2.5 text-center text-[17px] text-[#1B1A17] outline-none placeholder:text-[#C8C8C8] focus:border-[#2D5A45]"
        />
        {wrong && (
          <p className="mt-3 text-center text-[13px] text-[#A33A2B]">
            That password does not open this link.
          </p>
        )}
        <button
          type="submit"
          disabled={!password.trim() || busy}
          className="mt-6 w-full rounded-full bg-[#2D5A45] py-3.5 text-[15px] font-semibold text-[#FDFCFA] disabled:bg-[#D6D6D6]"
        >
          {busy ? "opening…" : "open"}
        </button>
      </form>
    </div>
  );
}
