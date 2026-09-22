"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * Saving a link.
 *
 * The one thing on a shared page that asks for an account, and the reason
 * the account is worth having: a link you were sent stops being a URL you
 * have to keep and becomes something the app tells you about when it grows.
 *
 * A signed-out visitor is not shown a control that fails. The tap carries
 * the intent through signup — the current URL plus ?save=1 — and this
 * component completes the save when it comes back holding a session. The
 * whole point is that nobody has to find the link again afterwards.
 */

type State = { signed_in: boolean; is_owner?: boolean; saved?: boolean; container_id?: string };

export function SaveButton({
  containerType,
  token,
  label = "save",
}: {
  containerType: "vault" | "collection" | "fit";
  token?: string;
  label?: string;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();

  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);
  const autoRan = useRef(false);

  const save = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("save_container" as never, {
      p_container_type: containerType,
      p_token: token,
    } as never);
    setBusy(false);
    if (!error && data) setState((s) => ({ ...(s ?? { signed_in: true }), saved: true }));
  }, [containerType, token]);

  useEffect(() => {
    let alive = true;
    if (!token) return;

    (async () => {
      const { data } = await supabase.rpc("my_save_state" as never, {
        p_container_type: containerType,
        p_token: token,
      } as never);
      if (!alive) return;
      const next = (data as unknown as State | null) ?? { signed_in: false };
      setState(next);

      // Coming back from signup with the intent still attached. Runs once,
      // then the marker leaves the URL so a refresh is not a second save.
      if (params.get("save") === "1" && next.signed_in && !next.saved && !next.is_owner) {
        if (autoRan.current) return;
        autoRan.current = true;
        await save();
        const rest = new URLSearchParams(params.toString());
        rest.delete("save");
        router.replace(`${pathname}${rest.toString() ? `?${rest}` : ""}`, { scroll: false });
      }
    })();

    return () => {
      alive = false;
    };
  }, [containerType, token, params, pathname, router, save]);

  async function unsave() {
    if (!state?.container_id) return;
    setBusy(true);
    const { error } = await supabase.rpc("unsave_container" as never, {
      p_container_type: containerType,
      p_container_id: state.container_id,
    } as never);
    setBusy(false);
    if (!error) setState((s) => (s ? { ...s, saved: false } : s));
  }

  // Nothing renders for the owner, and nothing renders before we know: a
  // button that changes its mind on hydration is worse than one that arrives.
  if (!token || !state || state.is_owner) return null;

  if (!state.signed_in) {
    const next = encodeURIComponent(
      `${pathname}?${new URLSearchParams({ ...Object.fromEntries(params), save: "1" })}`
    );
    return (
      <a
        href={`/signup?next=${next}`}
        className="inline-flex items-center gap-2 rounded-full bg-[#1A1A1A] px-5 py-2.5 text-[14px] font-medium text-white transition-opacity hover:opacity-80"
      >
        <BookmarkIcon filled={false} />
        {label}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => (state.saved ? unsave() : save())}
      disabled={busy}
      className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-[14px] font-medium transition-colors ${
        state.saved
          ? "border-[#2D5A45] bg-[#EDF6F1] text-[#2D5A45]"
          : "border-[#1A1A1A] bg-[#1A1A1A] text-white hover:opacity-80"
      }`}
    >
      <BookmarkIcon filled={!!state.saved} />
      {state.saved ? "saved" : label}
    </button>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M6.5 4.5h11a1 1 0 0 1 1 1V20l-6.5-3.8L5.5 20V5.5a1 1 0 0 1 1-1Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
