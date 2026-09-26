"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { shareUrl, type ShareState, type ShareType } from "@/lib/share-state";

/**
 * Sharing, on the web — the same model as the app's share sheet: private, or
 * anyone with the link. Turning the link on always mints a fresh token, so a
 * URL handed out before is dead; "new link" does the same without turning
 * sharing off. An optional password gates the link.
 *
 * The web had no way to share anything: a web-only owner could not turn a
 * link on, and the old copy button copied a tokenless URL that no longer
 * opens.
 */
export function ShareControl({
  type,
  id,
  username,
  initial,
}: {
  type: ShareType;
  id: string;
  username: string;
  initial: ShareState;
}) {
  const [state, setState] = useState<ShareState>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [password, setPassword] = useState("");

  const containerId = type === "vault" ? null : id;
  const url = state.visibility === "link_only" && state.token ? shareUrl(type, username, state.token, state.slug) : null;

  async function setVisibility(v: "private" | "link_only") {
    if (type === "vault") {
      const { error } = await supabase.rpc("set_vault_visibility", { p_visibility: v });
      if (error) throw error;
      return;
    }
    const table = type === "collection" ? "collections" : type === "fit" ? "fits" : "pieces";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from(table).update({ visibility: v }).eq("id", id);
    if (error) throw error;
  }

  async function mint(): Promise<{ token: string; slug: string | null }> {
    const { data, error } = await supabase.rpc("rotate_share_link", { p_container_type: type, p_container_id: containerId } as never);
    if (error) throw error;
    let slug = state.slug;
    // A piece has its slug written when its first link is minted.
    if (type === "piece" && !slug) {
      const { data: p } = await supabase.from("pieces").select("slug").eq("id", id).single();
      slug = (p as { slug?: string | null } | null)?.slug ?? null;
    }
    return { token: data as unknown as string, slug };
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError(e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : "Something went wrong.");
    }
    setBusy(false);
  }

  const turnOn = () =>
    run(async () => {
      const { token, slug } = await mint();
      await setVisibility("link_only");
      setState({ ...state, visibility: "link_only", token, slug });
    });
  const turnOff = () =>
    run(async () => {
      await setVisibility("private");
      setState({ ...state, visibility: "private" });
    });
  const rotate = () =>
    run(async () => {
      const { token, slug } = await mint();
      setState({ ...state, token, slug });
    });
  const savePassword = (pw: string | null) =>
    run(async () => {
      const { error } = await supabase.rpc("set_share_password", {
        p_container_type: type,
        p_container_id: containerId,
        p_password: pw,
      } as never);
      if (error) throw error;
      setState({ ...state, hasPassword: !!pw });
      setPassword("");
    });

  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  const option = (active: boolean) =>
    `flex-1 rounded-full border px-4 py-2 text-[13px] transition-colors ${
      active ? "border-[#1A1A1A] bg-[#1A1A1A] text-white" : "border-[#E8E5DE] text-[#6B6358] hover:border-[#1A1A1A]"
    }`;

  return (
    <section className="rounded-2xl border border-[#E8E5DE] p-4">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#999999]">sharing</h2>
      <div className="mt-3 flex gap-2">
        <button type="button" disabled={busy} onClick={() => state.visibility !== "private" && turnOff()} className={option(state.visibility === "private")}>
          private
        </button>
        <button type="button" disabled={busy} onClick={() => state.visibility !== "link_only" && turnOn()} className={option(state.visibility === "link_only")}>
          anyone with the link
        </button>
      </div>

      {url && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <input readOnly value={url} className="min-w-0 flex-1 truncate rounded-lg bg-[#F7F6F3] px-3 py-2 text-[12px] text-[#6B6358]" />
            <button type="button" onClick={copy} className="rounded-full bg-[#1A1A1A] px-4 py-2 text-[12px] font-medium text-white">
              {copied ? "copied" : "copy"}
            </button>
          </div>
          <div className="flex items-center justify-between text-[12px]">
            <button type="button" disabled={busy} onClick={rotate} className="text-[#6B6358] underline disabled:opacity-40">
              new link (the old one stops working)
            </button>
          </div>
          <div className="flex items-center gap-2">
            {state.hasPassword ? (
              <>
                <span className="flex-1 text-[12px] text-[#6B6358]">password protected</span>
                <button type="button" disabled={busy} onClick={() => savePassword(null)} className="text-[12px] text-[#6B6358] underline">
                  remove password
                </button>
              </>
            ) : (
              <>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="add a password (optional)"
                  className="min-w-0 flex-1 rounded-lg border border-[#E8E5DE] px-3 py-2 text-[12px]"
                />
                <button
                  type="button"
                  disabled={busy || password.trim().length < 4}
                  onClick={() => savePassword(password.trim())}
                  className="rounded-full border border-[#1A1A1A] px-4 py-2 text-[12px] disabled:opacity-40"
                >
                  set
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {error && <p className="mt-3 text-[12px] text-red-600">{error}</p>}
    </section>
  );
}
