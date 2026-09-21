/**
 * A link that no longer opens anything.
 *
 * Deliberately says nothing else. Revoked, made private, never valid and
 * simply mistyped all render this, because distinguishing them would tell a
 * stranger that a particular person has a particular collection — which is
 * the thing turning sharing off was meant to stop.
 */
export function DeadLink() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-[17px] text-[#1B1A17]">This link is no longer active.</p>
      <p className="mt-3 max-w-xs text-[14px] leading-relaxed text-[#6B6358]">
        It may have been turned off by whoever shared it.
      </p>
    </div>
  );
}
