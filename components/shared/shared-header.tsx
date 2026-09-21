import Image from "next/image";
import type { SharedOwner } from "@/lib/shared";

/**
 * The top of a shared page: whose it is, what it is, how much of it there is.
 *
 * Attribution is the point, not a leak, so the owner is always here. The
 * count is what this viewer can see — a vault of 42 with 3 marked private
 * reads as 39, and nothing says three are hidden, which would defeat the flag.
 */
export function SharedHeader({
  owner,
  title,
  count,
  kind,
}: {
  owner: SharedOwner;
  title: string;
  count: number;
  kind: "vault" | "collection";
}) {
  return (
    <header className="pb-10 pt-12 text-center">
      <div className="flex flex-col items-center gap-3">
        {owner.avatar_url ? (
          <Image
            src={owner.avatar_url}
            alt={owner.username}
            width={64}
            height={64}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1B1A17] text-[20px] font-semibold text-[#FDFCFA]">
            {owner.username.charAt(0).toUpperCase()}
          </div>
        )}
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#2D5A45]">
          @{owner.username}
        </p>
      </div>

      <h1 className="mt-6 text-[34px] font-bold leading-[1.1] tracking-[-0.03em] text-[#1B1A17] sm:text-[44px]">
        {title}
      </h1>
      <p className="mt-3 text-[15px] text-[#6B6358]">
        {count} {count === 1 ? "piece" : "pieces"}
        {kind === "collection" ? " in this collection" : ""}
      </p>
    </header>
  );
}
