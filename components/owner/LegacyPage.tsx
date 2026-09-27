import type { ReactNode } from "react";

/**
 * The padding the old shell gave its pages, for the owner pages not yet
 * rebuilt on the new UI (phases 4 and 5 of the web rebuild). Delete with
 * the last of them.
 */
export function LegacyPage({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-5xl px-4 py-8 font-mono-display">{children}</div>;
}
